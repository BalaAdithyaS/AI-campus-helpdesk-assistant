import os
import re
import logging
from typing import List, Optional, Tuple

from backend.app.models.schemas import (
    SourceCitation,
    KnowledgeEntry,
    ChatContextTurn,
    RetrievalDiagnostics
)
from backend.app.services.knowledge_base import kb_service

logger = logging.getLogger(__name__)

def _deduce_room_location(combined_text: str, entry_id: str) -> Optional[str]:
    """
    Synthesizes specific floor and navigation instructions for classroom/room queries.
    """
    # Technology Tower (TT) rooms: 101-420
    if entry_id == "kb_nav_001" or "technology tower" in combined_text.lower() or "tt" in combined_text.lower():
        tt_match = re.search(r"\btt[\s\-]*([1-4]\d{2})\b", combined_text, re.IGNORECASE)
        if tt_match:
            num = int(tt_match.group(1))
            if 101 <= num <= 120:
                return (
                    f"**Lecture Hall TT {num} is located on the Ground Floor of Technology Tower (Block TT).**\n\n"
                    f"• **Floor Allocation:** Rooms TT-101 through TT-120 are situated on the ground floor.\n"
                    f"• **Navigation Directions:** The room is accessible from the main atrium entrance opposite the Silver Jubilee Lawn."
                )
            elif 201 <= num <= 220:
                return (
                    f"**Lecture Hall TT {num} is located on the First Floor of Technology Tower (Block TT).**\n\n"
                    f"• **Floor Allocation:** Rooms TT-201 through TT-220 are located on the first floor.\n"
                    f"• **Navigation Directions:** Take the main elevators or central staircases near the atrium entrance to Floor 1."
                )
            elif 301 <= num <= 320:
                return (
                    f"**Lecture Hall TT {num} is located on the Second Floor of Technology Tower (Block TT).**\n\n"
                    f"• **Floor Allocation:** Rooms TT-301 through TT-320 are located on the second floor.\n"
                    f"• **Navigation Directions:** Take the main elevators or central staircases located near the atrium entrance opposite the Silver Jubilee Lawn up to Floor 2."
                )
            elif 401 <= num <= 420:
                return (
                    f"**Smart Room TT {num} is located on the Third Floor of Technology Tower (Block TT).**\n\n"
                    f"• **Floor Allocation:** Smart classrooms TT-401 through TT-420 are situated on the third floor.\n"
                    f"• **Navigation Directions:** Use the central elevators near the atrium entrance to reach the 3rd floor."
                )

    # Silver Jubilee Tower (SJT) rooms
    if entry_id == "kb_nav_002" or "silver jubilee" in combined_text.lower() or "sjt" in combined_text.lower():
        if re.search(r"\bgallery\s+hall\s*1\b", combined_text, re.IGNORECASE):
            return (
                f"**SJT Gallery Hall 1 is located on the 1st Floor of Silver Jubilee Tower (SJT).**\n\n"
                f"• **Position:** Adjacent to the eastern entrance on the 1st floor.\n"
                f"• **Accessibility:** Wheelchair ramps are located at the north-west porch."
            )
        sjt_match = re.search(r"\bsjt[\s\-]*(g|[1-7]\d{2})\b", combined_text, re.IGNORECASE)
        if sjt_match:
            val = sjt_match.group(1).upper()
            if val == "G":
                return (
                    f"**Room SJT-G is located on the Ground Concourse of Silver Jubilee Tower (SJT).**\n\n"
                    f"• **Access:** Located right off the ground concourse entrance.\n"
                    f"• **Accessibility:** Ramp access is available at the north-west porch."
                )
            else:
                fl = val[0]
                fl_suffix = "st" if fl == "1" else "nd" if fl == "2" else "rd" if fl == "3" else "th"
                return (
                    f"**Room SJT {val} is located on the {fl}{fl_suffix} Floor of Silver Jubilee Tower (SJT).**\n\n"
                    f"• **Building Layout:** Silver Jubilee Tower houses tutorial rooms across 8 floors (SJT-{fl}00 series rooms are on the {fl}{fl_suffix} floor).\n"
                    f"• **Accessibility:** Main high-speed elevators and north-west wheelchair ramps serve all floors."
                )

    # Main Administration Building (kb_nav_003)
    if entry_id == "kb_nav_003":
        q_low = combined_text.lower()
        if "registrar" in q_low or "cash" in q_low or "accounts" in q_low or "admission" in q_low:
            return (
                f"**The Office of the Registrar is located on the Ground Floor of the Main Administration Building (Centre Block).**\n\n"
                f"• **Ground Floor Services:** Registrar's Office, Cash and Accounts Section, and Admissions Helpdesk.\n"
                f"• **Visiting Hours:** 09:30 AM to 04:30 PM, Monday through Friday."
            )
        if "controller" in q_low or "coe" in q_low or "vice-chancellor" in q_low or "research" in q_low:
            return (
                f"**The Controller of Examinations (COE) office is located on the First Floor of the Main Administration Building (Centre Block).**\n\n"
                f"• **First Floor Offices:** Office of the Vice-Chancellor, Controller of Examinations (COE), and Academic Research Cell.\n"
                f"• **Office Hours:** 09:30 AM to 04:30 PM on weekdays."
            )
        if "welfare" in q_low or "dsw" in q_low or "international" in q_low or "career" in q_low or "placement" in q_low:
            return (
                f"**The Office of the Dean of Student Welfare is located on the Second Floor of the Main Administration Building (Centre Block).**\n\n"
                f"• **Second Floor Offices:** Dean of Student Welfare, International Relations Office, and Career Development Center (CDC).\n"
                f"• **Visiting Hours:** 09:30 AM to 04:30 PM on weekdays."
            )

    return None

def _synthesize_specialized_answer(
    combined_text: str,
    entry: KnowledgeEntry
) -> Optional[str]:
    """
    Generates high-precision, direct answers for specific campus policies, timings, and procedures.
    """
    q_low = combined_text.lower()
    e_id = entry.id

    # 1. Computing Labs (kb_lab_001)
    if e_id == "kb_lab_001":
        if any(w in q_low for w in ["close", "closing", "shut"]):
            return (
                "**The Central Computing Labs close at 08:00 PM on weekdays (Monday–Friday) and at 05:00 PM on Saturdays.**\n\n"
                "• **Operating Hours:** Monday to Friday 08:30 AM – 08:00 PM; Saturdays 09:00 AM – 05:00 PM.\n"
                "• **Open-Access Practice:** Weekday evenings between 05:30 PM and 08:00 PM (biometric entry and active ID required).\n"
                "• **Location:** Technology Tower (TT), 3rd Floor."
            )
        if any(w in q_low for w in ["open", "timing", "timings", "hours", "schedule", "when"]):
            return (
                "**The Central Computing Labs (TT 3rd Floor) operate Monday–Friday from 08:30 AM to 08:00 PM, and Saturdays from 09:00 AM to 05:00 PM.**\n\n"
                "• **Guided Practicals:** Scheduled during standard daytime academic slots.\n"
                "• **Open Practice Slots:** Weekday evenings from 05:30 PM to 08:00 PM.\n"
                "• **Access Protocol:** Biometric check-in with active student ID; closed on official university holidays."
            )

    # 2. Electronics Lab (kb_lab_002)
    if e_id == "kb_lab_002":
        return (
            "**The Electronics and Hardware Prototyping Labs (SJT 4th Floor) are open Monday to Friday from 09:00 AM to 04:30 PM.**\n\n"
            "• **Component Checkout:** Requires a validated lab pass issued by your course instructor.\n"
            "• **Safety Requirement:** Closed safety footwear is mandatory in all fabrication and high-voltage testing bays."
        )

    # 3. Central Library (kb_lib_001)
    if e_id == "kb_lib_001":
        if any(w in q_low for w in ["borrow", "how many books", "limit", "keep"]):
            return (
                "**Undergraduate students may borrow up to 4 books simultaneously for an initial loan period of 14 days.**\n\n"
                "• **Online Renewals:** Renewable up to two times online via WebOPAC (provided no hold exists).\n"
                "• **Library Operating Hours:** Weekdays 08:00 AM – 11:00 PM; Weekends 09:00 AM – 06:00 PM."
            )
        if any(w in q_low for w in ["timing", "timings", "open", "close", "hours", "when"]):
            return (
                "**The Central Library is open from 08:00 AM to 11:00 PM on weekdays, and 09:00 AM to 06:00 PM on weekends.**\n\n"
                "• **Exam Extended Hours:** During mid-term and end-term examinations, reading halls remain open until 01:00 AM.\n"
                "• **Borrowing Entitlement:** 4 books for 14 days for undergraduate students."
            )

    # 4. Lost ID Card (kb_proc_001)
    if e_id == "kb_proc_001":
        if any(w in q_low for w in ["fee", "cost", "fine", "how much", "price", "pay"]):
            return (
                "**The replacement fee for a lost or damaged student smart ID card is 300 units.**\n\n"
                "• **Step 1:** Report the loss on the Student Intranet to instantly disable RFID and payment functions.\n"
                "• **Step 2:** Remit the 300 replacement fee via the online student fee portal.\n"
                "• **Step 3:** Bring the payment transaction slip and government photo ID to the Registrar's Identification Cell (Main Administration Building Ground Floor, Counter 4).\n"
                "• **Turnaround:** Duplicate smart cards are printed within 48 business hours."
            )
        return (
            "**To replace a lost student ID card, follow these three steps:**\n\n"
            "1. **Deactivate Card:** Report the loss immediately on the Student Intranet to disable RFID access and payment functions.\n"
            "2. **Pay Fee:** Remit the synthetic replacement fee of 300 units through the online fee gateway.\n"
            "3. **Collect ID:** Submit your payment slip and government photo ID at Counter 4 of the Registrar's Identification Cell (Main Admin Building Ground Floor). Replacement cards are issued within 48 business hours."
        )

    # 5. Wi-Fi Configuration (kb_proc_003)
    if e_id == "kb_proc_003":
        return (
            "**To connect your device to the campus Wi-Fi network (SSID: CAMPUS-SECURE):**\n\n"
            "1. **Connect:** Select network SSID **CAMPUS-SECURE**.\n"
            "2. **Security Certificate:** Open a browser and navigate to `wifi-setup.local` to download the 802.1X certificate.\n"
            "3. **Login Credentials:** Authenticate using your Student Registration Number and intranet network password.\n"
            "4. **Registration Cap:** Each student may register up to three distinct MAC addresses."
        )

    # 6. Event Registration & Hackathons (kb_evt_001)
    if e_id == "kb_evt_001":
        if any(w in q_low for w in ["team size", "how many members", "team limit"]):
            return (
                "**Campus hackathon and technical symposium team sizes must be between 2 and 4 members.**\n\n"
                "• **Registration Route:** Student Intranet > Events > Technical Symposium.\n"
                "• **Verification:** Each participant must upload their current semester registration receipt and university ID.\n"
                "• **Deadline:** Closes strictly 72 hours before the keynote (no spot registrations)."
            )
        return (
            "**Registration for the annual university hackathon and symposium is completed online via the student intranet:**\n\n"
            "1. **Access:** Navigate to **Student Intranet > Events > Technical Symposium**.\n"
            "2. **Teams:** Form a team of 2 to 4 members.\n"
            "3. **Verification:** Upload your current semester registration receipt and university ID.\n"
            "4. **Timeline:** Registration opens 4 weeks before the event and closes strictly 72 hours prior to the keynote. No spot registrations are allowed."
        )

    # 7. Student Clubs (kb_evt_002)
    if e_id == "kb_evt_002":
        return (
            "**Student club recruitment occurs at the start of Fall and Winter semesters during Club Orientation Week at the Student Activity Centre (SAC).**\n\n"
            "• **Application Cap:** Students may apply to a maximum of 3 registered clubs per semester.\n"
            "• **Auditions & Results:** Interview slots are scheduled via the club portal; results are published within 5 business days."
        )

    # 8. Attendance Policy (kb_acad_002)
    if e_id == "kb_acad_002":
        return (
            "**The minimum mandatory attendance required to qualify for semester end-term examinations is 75%.**\n\n"
            "• **Medical & OD Condonation:** Attendance between 65% and 74% due to hospitalization or official university representation may be condoned by submitting a Medical Leave or On-Duty (OD) form within 3 business days of returning to class.\n"
            "• **Debarment:** Attendance below 65% results in strict course debarment and mandatory re-registration."
        )

    # 9. Course Registration FFCS (kb_acad_001)
    if e_id == "kb_acad_001":
        return (
            "**Under FFCS, students must register for a minimum of 16 credits and a maximum of 27 credits per semester.**\n\n"
            "• **Add/Drop Period:** The course adjustment window opens on the third day of instruction and remains active for exactly 5 academic days.\n"
            "• **Slotting:** Registration time slots are staggered based on earned credits and CGPA."
        )

    # 10. Hostel Outing & Curfew (kb_proc_002)
    if e_id == "kb_proc_002":
        return (
            "**Hostel students must return to campus before the 09:00 PM curfew.**\n\n"
            "• **Leave Submission:** Submit electronic leave requests via the Student Mobile Companion app at least 24 hours prior to departure.\n"
            "• **Overnight Approval:** Overnight leaves require digital OTP authorization from registered parents or guardians.\n"
            "• **Gate Check:** Tap your student RFID smart card at security gates upon departure and return."
        )

    # 11. Health Center (kb_sup_001)
    if e_id == "kb_sup_001":
        return (
            "**The Campus Health Center is located near the North Residential Complex and operates 24/7 for outpatient emergencies.**\n\n"
            "• **Emergency Ambulance:** Contact campus extension **1100** for acute medical dispatch.\n"
            "• **Routine Doctor Hours:** Consultations are held between 08:30 AM and 07:00 PM daily.\n"
            "• **Requirement:** Student ID card is required for medical file lookup."
        )

    # 12. Campus Facilities & Amenities Overview (kb_fac_001)
    if e_id == "kb_fac_001":
        return (
            "**The university provides comprehensive campus facilities to support student academic, athletic, and daily life:**\n\n"
            "• **Academic & Research:** Central Library (8 AM – 11 PM weekdays), Computing Labs (TT 3rd floor), and Hardware Prototyping Labs (SJT 4th floor).\n"
            "• **Sports & Fitness:** Multi-Purpose Sports Complex with indoor badminton courts, outdoor running tracks, and morning/evening gymnasium sessions.\n"
            "• **Health & Wellness:** Campus Health Center near North Residential Complex (24/7 outpatient and ambulance dispatch Ext. 1100), and confidential counseling at Central Library Ground Floor.\n"
            "• **Daily Services & Amenities:** High-speed campus Wi-Fi (SSID: CAMPUS-SECURE), free daytime campus shuttle buses connecting academic and hostel zones, and multi-cuisine dining cafeterias.\n"
            "• **Student Activities:** Student Activity Centre (SAC) for student club recruitment and extracurricular events."
        )

    # 13. Event Cancellation & Withdrawal (kb_evt_003)
    if e_id == "kb_evt_003":
        return (
            "**Event registration cancellation or team withdrawal must be submitted via the Student Intranet at least 48 hours before the event:**\n\n"
            "1. **Access Portal:** Go to **Student Intranet > Events > My Registrations > Request Cancellation**.\n"
            "2. **48-Hour Deadline:** Cancellations submitted at least 48 hours prior to start receive automated synthetic fee credit vouchers for paid workshops.\n"
            "3. **Team Substitution:** Team leaders may substitute a replacement participant up to 24 hours before the event.\n"
            "4. **No-Show Consequence:** Cancellations within 24 hours or unexcused no-shows forfeit certificate eligibility and may incur a registration flag."
        )

    return None

def generate_deterministic_answer(
    query: str,
    citations: List[SourceCitation],
    evidence_strength: str,
    context: Optional[List[ChatContextTurn]] = None,
    diagnostics: Optional[RetrievalDiagnostics] = None
) -> str:
    """
    Constructs an explicit, factual, transparent answer strictly from retrieved knowledge base evidence.
    Directly answers specific entity and follow-up questions first, followed by supporting guidance.
    """
    if not citations or evidence_strength == "none":
        return (
            "We could not locate verified documentation in the campus knowledge base "
            "for this query. To avoid misinformation, CampusIQ does not speculate. "
            "Please check with the University Student Services Helpdesk or your school "
            "academic coordinator for verified guidance."
        )

    primary_citation = citations[0]
    entry: Optional[KnowledgeEntry] = kb_service.get_by_id(primary_citation.id)
    if not entry:
        return primary_citation.excerpt

    # Combine query, diagnostics context, and recent history turns for full conversational understanding
    context_snippets = []
    if context:
        for t in context[-4:]:
            context_snippets.append(t.text)
    if diagnostics and diagnostics.normalized_query:
        context_snippets.append(diagnostics.normalized_query)
    if diagnostics and diagnostics.resolved_entity:
        context_snippets.append(diagnostics.resolved_entity)

    full_conversational_text = f"{query} {' '.join(context_snippets)}"

    # 1. Check for specific room / floor / navigation direct deduction
    direct_room_answer = _deduce_room_location(full_conversational_text, entry.id)
    if direct_room_answer:
        return direct_room_answer

    # 2. Check for specialized fact & policy synthesis
    direct_specialized_answer = _synthesize_specialized_answer(full_conversational_text, entry)
    if direct_specialized_answer:
        return direct_specialized_answer

    # 3. Clean general fallback grounded strictly in document content
    cleaned_content = re.sub(r"\[Synthetic demonstration record[^\]]*\]", "", entry.content).strip()

    paragraphs = []
    category = entry.category
    title = entry.title

    paragraphs.append(f"According to the **{title}** ({category}):\n")
    paragraphs.append(cleaned_content)

    if len(citations) > 1:
        additional_sources = [f"*{c.title}*" for c in citations[1:]]
        paragraphs.append(f"\n\nAdditional related information is available in: {', '.join(additional_sources)}.")

    return "\n\n".join(paragraphs).strip()

def synthesize_answer(
    query: str,
    status: str,
    citations: List[SourceCitation],
    evidence_strength: str,
    clarification_prompt: Optional[str] = None,
    context: Optional[List[ChatContextTurn]] = None,
    diagnostics: Optional[RetrievalDiagnostics] = None
) -> str:
    """
    Dispatcher for answer generation depending on system status.
    """
    if status == "clarification_needed":
        prompt_text = clarification_prompt or "Could you please specify which campus department, facility, or procedure you are referring to?"
        return (
            f"Your question appears ambiguous and could relate to multiple campus services.\n\n"
            f"💡 **Clarification Needed:**\n{prompt_text}\n\n"
            f"Please reply with additional details so I can locate the exact documented procedure."
        )

    if status == "out_of_scope":
        return (
            "I am **CampusIQ**, an AI campus helpdesk assistant designed exclusively "
            "for university campus support. I can only answer questions related to campus "
            "navigation, classroom locations, lab timings, event registration, and documented "
            "university procedures. I cannot answer general knowledge or external queries."
        )

    if status == "insufficient_evidence":
        return (
            "We could not find verified documentation for this query in the campus knowledge base. "
            "To prevent providing inaccurate information, we do not speculate on undocumented schedules or policies.\n\n"
            "Please contact the **University Student Services Helpdesk** or your department coordinator for official assistance."
        )

    # Status is 'answered'
    return generate_deterministic_answer(
        query=query,
        citations=citations,
        evidence_strength=evidence_strength,
        context=context,
        diagnostics=diagnostics
    )
