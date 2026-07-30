# Kita Kerja

Job portal for Indonesian informal workers. Core thesis: workers don't lack experience, they lack portable proof — the product converts spoken experience into a verifiable credential.

## Language

### People

**Pekerja**:
An informal worker (e.g. tukang bangunan, ART) who owns a Kartu Kerja. The primary user.
_Avoid_: worker, job seeker, user, kandidat

**Pemberi Kerja**:
A person hiring a Pekerja — a household, small business, or small contractor. Explicitly not an HR department.
_Avoid_: employer, recruiter, HRD, perusahaan

**Pendamping**:
A companion (kelurahan staff, karang taruna, RT official) who registers and assists a Pekerja who has no smartphone. Acts through their own login; the account and credential always belong to the Pekerja, who can claim direct access later by binding a phone number.
_Avoid_: assistant, agent, admin, account owner

**Publik**:
Anyone, without an account, who scans a Kartu Kerja QR code and opens the verification page.
_Avoid_: visitor, guest

### Core artifacts

**Kartu Kerja**:
The portable work credential owned by a Pekerja — printable, QR-coded, publicly verifiable without an account. The product's central artifact.
_Avoid_: profile, CV, portofolio

**Ngobrol Kerja**:
The adaptive voice interview that turns a Pekerja's spoken experience into structured skills. Voice-first; a manual path always exists.
_Avoid_: interview, onboarding, kuesioner

**Keahlian Baku**:
A canonical skill in the platform taxonomy. Free-text skill names (nama_diajukan) are normalized to a Keahlian Baku; anything unmatched stays self-declared only.
_Avoid_: skill, tag, competency

**Kesepakatan Kerja**:
The digital work agreement confirmed by both parties via OTP. Enforcement is by reputation, not escrow.
_Avoid_: contract, order, booking

### Trust layers (lapis kepercayaan)

Every skill on a Kartu Kerja carries exactly one layer, **derived — never stored**:

**Terverifikasi**:
The Pekerja has at least one completed pekerjaan (confirmed by both parties) whose lowongan required that Keahlian Baku.
_Avoid_: verified badge, certified

**Dinilai**:
At least one penilaian (rating) exists on a completed pekerjaan linked to that Keahlian Baku.
_Avoid_: rated, reviewed

**Diklaim**:
The skill came from Ngobrol Kerja or manual entry and the Pekerja confirmed it — no completed job backs it yet.
_Avoid_: self-reported, unverified, claimed

### Protection features

**Saringan Aman**:
The job-risk screening that flags suspicious patterns in a lowongan and suggests questions the Pekerja should ask. Never declares a job fraudulent.
_Avoid_: fraud detection, scam filter

**Moderasi**:
A pre-publish hold on a lowongan whose risk score is high. The Pemberi Kerja is shown what to fix and may revise or explicitly confirm publication; a published lowongan still carries its risk level for display.
_Avoid_: rejection, ban, blocked

**Upah Terang**:
The deterministic wage benchmark per Keahlian Baku per wilayah, based on UMK. AI never touches wage numbers.
_Avoid_: wage estimate, salary insight
