// ============================================================
// FEDKO DEMO DATA — LECTURERS
// 5 featured demo profiles + background roster per dept
// Student:Lecturer ratio enforced at 7:1
// ============================================================

export type Rank = "Professor" | "Associate Professor" | "Senior Lecturer" | "Lecturer I" | "Lecturer II" | "Assistant Lecturer" | "Graduate Assistant";

export interface Lecturer {
  id: string;
  staffId: string;
  name: string;
  title: string;
  rank: Rank;
  dept: string;
  deptName: string;
  specialization: string;
  email: string;
  phone: string;
  office: string;
  coursesCurrent: string[];   // course codes teaching this semester
  weeklyHours: number;
  isFeatured?: boolean;
  bio?: string;
  qualifications?: string[];
  publications?: number;
  yearsService?: number;
  imageInitials: string;
  colorClass: string;        // for avatar background
}

// ── 5 FEATURED DEMO LECTURER PROFILES ────────────────────────

export const FEATURED_LECTURERS: Lecturer[] = [
  {
    id: "lec-001",
    staffId: "FEDKO/SCI/CHM/001",
    name: "Prof. Kakashi Hatake",
    title: "Professor",
    rank: "Professor",
    dept: "CHM",
    deptName: "Department of Chemistry",
    specialization: "Organic Chemistry & Reaction Mechanisms",
    email: "k.hatake@fedko.edu.ng",
    phone: "+234 803 000 0001",
    office: "CHM Building, Room 201",
    coursesCurrent: ["CHM 411", "CHM 413", "CHM 491"],  // 3 courses → 6x/week
    weeklyHours: 8,
    isFeatured: true,
    bio: "Prof. Hatake is the Head of Department of Chemistry with over 22 years of distinguished service at FEDKO. He pioneered the university's GCMS facility and has mentored over 200 postgraduate students. A Fellow of the Chemical Society of Nigeria (FCSN), he also consults for the Nigerian National Petroleum Corporation (NNPC) on petrochemical processes.",
    qualifications: ["B.Sc. Chemistry (Univ. of Ibadan)", "M.Sc. Organic Chemistry (Ahmadu Bello University)", "Ph.D. Organic Chemistry (University of Nottingham, UK)"],
    publications: 87,
    yearsService: 22,
    imageInitials: "KH",
    colorClass: "bg-[#2A1F5E]",
  },
  {
    id: "lec-002",
    staffId: "FEDKO/SCI/PHY/003",
    name: "Prof. Sasuke Uchiha",
    title: "Professor",
    rank: "Professor",
    dept: "PHY",
    deptName: "Department of Physics",
    specialization: "Theoretical Physics & Quantum Mechanics",
    email: "s.uchiha@fedko.edu.ng",
    phone: "+234 803 000 0002",
    office: "PHY Building, Room 305",
    coursesCurrent: ["PHY 411", "PHY 413", "PHY 491"],
    weeklyHours: 8,
    isFeatured: true,
    bio: "Prof. Uchiha is an internationally recognised theoretical physicist and the youngest full Professor in FEDKO's history. He received the Nigerian Young Scientist Award (2018) and has represented Nigeria at the International Union of Pure and Applied Physics (IUPAP) General Assembly. His research on quantum decoherence in topological materials has attracted grants from TETFund and the World Bank.",
    qualifications: ["B.Sc. Physics (Obafemi Awolowo University)", "M.Sc. Theoretical Physics (University of Lagos)", "Ph.D. Quantum Physics (MIT, USA)"],
    publications: 64,
    yearsService: 14,
    imageInitials: "SU",
    colorClass: "bg-[#BD5B2C]",
  },
  {
    id: "lec-003",
    staffId: "FEDKO/SCI/CSC/007",
    name: "Prof. Shikamaru Nara",
    title: "Professor & Head of Department",
    rank: "Professor",
    dept: "CSC",
    deptName: "Department of Computer Science",
    specialization: "Artificial Intelligence & Systems Design",
    email: "s.nara@fedko.edu.ng",
    phone: "+234 803 000 0003",
    office: "CSC Building, Room 101",
    coursesCurrent: ["CSC 411", "CSC 415", "CSC 491"],
    weeklyHours: 8,
    isFeatured: true,
    bio: "Prof. Nara's work on AI-driven scheduling systems has been cited by the National Universities Commission (NUC) as a model for tertiary institution modernisation. He holds a TETFund Research Grant (2022–2025) for intelligent timetable generation — the intellectual foundation of the ClashFree platform. He is an NCS Fellow and serves on the NUC ICT Advisory Board.",
    qualifications: ["B.Sc. Computer Science (University of Nigeria, Nsukka)", "M.Sc. Artificial Intelligence (University of Edinburgh)", "Ph.D. Intelligent Systems (University of Southampton, UK)"],
    publications: 72,
    yearsService: 18,
    imageInitials: "SN",
    colorClass: "bg-[#4F7A4B]",
  },
  {
    id: "lec-004",
    staffId: "FEDKO/SCI/BCH/005",
    name: "Dr. Sakura Haruno",
    title: "Associate Professor",
    rank: "Associate Professor",
    dept: "BCH",
    deptName: "Department of Biochemistry",
    specialization: "Molecular Biochemistry & Drug Design",
    email: "s.haruno@fedko.edu.ng",
    phone: "+234 803 000 0004",
    office: "BCH Building, Room 112",
    coursesCurrent: ["BCH 311", "BCH 313", "BCH 315"],
    weeklyHours: 8,
    isFeatured: true,
    bio: "Dr. Haruno is the HOD of Biochemistry and a leading researcher in tropical disease biochemistry. Her lab has produced novel drug candidates against malaria and tuberculosis with NAFDAC pre-certification collaboration. She was awarded the TWAS Young Scientist Prize (2020) and is a Fellow of the Nigerian Society of Biochemistry and Molecular Biology.",
    qualifications: ["B.Sc. Biochemistry (University of Benin)", "M.Sc. Clinical Biochemistry (University of Ibadan)", "Ph.D. Medicinal Biochemistry (King's College London)"],
    publications: 48,
    yearsService: 11,
    imageInitials: "SH",
    colorClass: "bg-[#6B5298]",
  },
  {
    id: "lec-005",
    staffId: "FEDKO/SCI/MTH/009",
    name: "Dr. Ino Yamanaka",
    title: "Senior Lecturer",
    rank: "Senior Lecturer",
    dept: "MTH",
    deptName: "Department of Mathematics",
    specialization: "Applied Mathematics & Fluid Dynamics",
    email: "i.yamanaka@fedko.edu.ng",
    phone: "+234 803 000 0005",
    office: "MTH Building, Room 204",
    coursesCurrent: ["MTH 311", "MTH 317", "MTH 491"],
    weeklyHours: 8,
    isFeatured: true,
    bio: "Dr. Yamanaka is one of FEDKO's most innovative educators, known for her flipped-classroom approach and student-centered pedagogy. She received the FEDKO Best Teacher Award three consecutive years (2021–2023) and sits on the Senate Academic Standards Committee. Her research on fluid dynamics models for petroleum reservoir simulation has attracted PTDF funding.",
    qualifications: ["B.Sc. Mathematics (University of Ilorin)", "M.Sc. Applied Mathematics (University of Ghana)", "Ph.D. Fluid Mechanics (Imperial College London)"],
    publications: 31,
    yearsService: 9,
    imageInitials: "IY",
    colorClass: "bg-[#B8862A]",
  },
];

// ── BACKGROUND ROSTER (per-dept sample for timetable population) ──────────────
// 15–18 lecturers per dept; named with Naruto universe (FEDKO lore)

type MinLecturer = Pick<Lecturer, "id"|"staffId"|"name"|"rank"|"dept"|"coursesCurrent"|"imageInitials"|"colorClass">;

export const DEPT_ROSTER: Record<string, MinLecturer[]> = {
  CHM: [
    { id: "lec-chm-01", staffId: "FEDKO/SCI/CHM/001", name: "Prof. Kakashi Hatake", rank: "Professor", dept: "CHM", coursesCurrent: ["CHM 411","CHM 413","CHM 491"], imageInitials: "KH", colorClass: "bg-[#8B4A3D]" },
    { id: "lec-chm-02", staffId: "FEDKO/SCI/CHM/002", name: "Dr. Kurenai Yuhi", rank: "Associate Professor", dept: "CHM", coursesCurrent: ["CHM 311","CHM 313"], imageInitials: "KY", colorClass: "bg-[#8B5A4D]" },
    { id: "lec-chm-03", staffId: "FEDKO/SCI/CHM/003", name: "Dr. Asuma Sarutobi", rank: "Senior Lecturer", dept: "CHM", coursesCurrent: ["CHM 211","CHM 213"], imageInitials: "AS", colorClass: "bg-[#4A3D8F]" },
    { id: "lec-chm-04", staffId: "FEDKO/SCI/CHM/004", name: "Mr. Rock Lee", rank: "Lecturer I", dept: "CHM", coursesCurrent: ["CHM 101","CHM 103"], imageInitials: "RL", colorClass: "bg-[#5C7A8A]" },
    { id: "lec-chm-05", staffId: "FEDKO/SCI/CHM/005", name: "Mrs. Tenten Higurashi", rank: "Lecturer I", dept: "CHM", coursesCurrent: ["CHM 102","CHM 104"], imageInitials: "TH", colorClass: "bg-[#3D5E3A]" },
    { id: "lec-chm-06", staffId: "FEDKO/SCI/CHM/006", name: "Dr. Yamato Tenzo", rank: "Senior Lecturer", dept: "CHM", coursesCurrent: ["CHM 215","CHM 217"], imageInitials: "YT", colorClass: "bg-[#A0522D]" },
    { id: "lec-chm-07", staffId: "FEDKO/SCI/CHM/007", name: "Dr. Konan Amegakure", rank: "Senior Lecturer", dept: "CHM", coursesCurrent: ["CHM 315","CHM 317"], imageInitials: "KA", colorClass: "bg-[#6E5A7E]" },
    { id: "lec-chm-08", staffId: "FEDKO/SCI/CHM/008", name: "Mr. Sai Yamanaka", rank: "Lecturer II", dept: "CHM", coursesCurrent: ["CHM 319","CHM 321"], imageInitials: "SY", colorClass: "bg-[#7A6B45]" },
    { id: "lec-chm-09", staffId: "FEDKO/SCI/CHM/009", name: "Mr. Suigetsu Hozuki", rank: "Lecturer II", dept: "CHM", coursesCurrent: ["CHM 412","CHM 414"], imageInitials: "SH", colorClass: "bg-[#5B4636]" },
    { id: "lec-chm-10", staffId: "FEDKO/SCI/CHM/010", name: "Dr. Karin Uzumaki", rank: "Lecturer I", dept: "CHM", coursesCurrent: ["CHM 312","CHM 314"], imageInitials: "KU", colorClass: "bg-[#2A1F5E]" },
    { id: "lec-chm-11", staffId: "FEDKO/SCI/CHM/011", name: "Mr. Juugo Ryuuchi", rank: "Assistant Lecturer", dept: "CHM", coursesCurrent: ["CHM 420","CHM 424"], imageInitials: "JR", colorClass: "bg-[#BD5B2C]" },
    { id: "lec-chm-12", staffId: "FEDKO/SCI/CHM/012", name: "Ms. Hinata Hyuga", rank: "Assistant Lecturer", dept: "CHM", coursesCurrent: ["CHM 219","CHM 220"], imageInitials: "HH", colorClass: "bg-[#4F7A4B]" },
    { id: "lec-chm-13", staffId: "FEDKO/SCI/CHM/013", name: "Mr. Choji Akimichi", rank: "Lecturer II", dept: "CHM", coursesCurrent: ["CHM 323","CHM 421"], imageInitials: "CA", colorClass: "bg-[#6B5298]" },
    { id: "lec-chm-14", staffId: "FEDKO/SCI/CHM/014", name: "Prof. Jiraiya Namikaze", rank: "Professor", dept: "CHM", coursesCurrent: ["CHM 415","CHM 417"], imageInitials: "JN", colorClass: "bg-[#B8862A]" },
    { id: "lec-chm-15", staffId: "FEDKO/SCI/CHM/015", name: "Dr. Tsunade Senju", rank: "Associate Professor", dept: "CHM", coursesCurrent: ["CHM 416","CHM 418"], imageInitials: "TS", colorClass: "bg-[#8B4A3D]" },
    { id: "lec-chm-16", staffId: "FEDKO/SCI/CHM/016", name: "Mr. Shino Aburame", rank: "Graduate Assistant", dept: "CHM", coursesCurrent: ["CHM 492"], imageInitials: "SA", colorClass: "bg-[#8B5A4D]" },
  ],
  PHY: [
    { id: "lec-phy-01", staffId: "FEDKO/SCI/PHY/001", name: "Prof. Sasuke Uchiha", rank: "Professor", dept: "PHY", coursesCurrent: ["PHY 411","PHY 413","PHY 491"], imageInitials: "SU", colorClass: "bg-[#4A3D8F]" },
    { id: "lec-phy-02", staffId: "FEDKO/SCI/PHY/002", name: "Dr. Itachi Uchiha", rank: "Associate Professor", dept: "PHY", coursesCurrent: ["PHY 311","PHY 313"], imageInitials: "IU", colorClass: "bg-[#5C7A8A]" },
    { id: "lec-phy-03", staffId: "FEDKO/SCI/PHY/003", name: "Dr. Obito Uchiha", rank: "Senior Lecturer", dept: "PHY", coursesCurrent: ["PHY 211","PHY 213"], imageInitials: "OU", colorClass: "bg-[#3D5E3A]" },
    { id: "lec-phy-04", staffId: "FEDKO/SCI/PHY/004", name: "Mr. Minato Namikaze", rank: "Lecturer I", dept: "PHY", coursesCurrent: ["PHY 101","PHY 103"], imageInitials: "MN", colorClass: "bg-[#A0522D]" },
    { id: "lec-phy-05", staffId: "FEDKO/SCI/PHY/005", name: "Mrs. Kushina Uzumaki", rank: "Lecturer I", dept: "PHY", coursesCurrent: ["PHY 102","PHY 104"], imageInitials: "KU", colorClass: "bg-[#6E5A7E]" },
    { id: "lec-phy-06", staffId: "FEDKO/SCI/PHY/006", name: "Dr. Nagato Pain", rank: "Senior Lecturer", dept: "PHY", coursesCurrent: ["PHY 315","PHY 317"], imageInitials: "NP", colorClass: "bg-[#7A6B45]" },
    { id: "lec-phy-07", staffId: "FEDKO/SCI/PHY/007", name: "Dr. Konan Amegakure-Phy", rank: "Lecturer I", dept: "PHY", coursesCurrent: ["PHY 312","PHY 314"], imageInitials: "KP", colorClass: "bg-[#5B4636]" },
    { id: "lec-phy-08", staffId: "FEDKO/SCI/PHY/008", name: "Mr. Yahiko Uzumaki", rank: "Lecturer II", dept: "PHY", coursesCurrent: ["PHY 219","PHY 321"], imageInitials: "YU", colorClass: "bg-[#2A1F5E]" },
    { id: "lec-phy-09", staffId: "FEDKO/SCI/PHY/009", name: "Mr. Darui Kumogakure", rank: "Lecturer II", dept: "PHY", coursesCurrent: ["PHY 411","PHY 419"], imageInitials: "DK", colorClass: "bg-[#BD5B2C]" },
    { id: "lec-phy-10", staffId: "FEDKO/SCI/PHY/010", name: "Dr. Killer Bee", rank: "Lecturer I", dept: "PHY", coursesCurrent: ["PHY 415","PHY 421"], imageInitials: "KB", colorClass: "bg-[#4F7A4B]" },
    { id: "lec-phy-11", staffId: "FEDKO/SCI/PHY/011", name: "Ms. Karui Kumogakure", rank: "Assistant Lecturer", dept: "PHY", coursesCurrent: ["PHY 107","PHY 108"], imageInitials: "KK", colorClass: "bg-[#6B5298]" },
    { id: "lec-phy-12", staffId: "FEDKO/SCI/PHY/012", name: "Mr. Omoi Kumogakure", rank: "Assistant Lecturer", dept: "PHY", coursesCurrent: ["PHY 322","PHY 324"], imageInitials: "OK", colorClass: "bg-[#B8862A]" },
    { id: "lec-phy-13", staffId: "FEDKO/SCI/PHY/013", name: "Dr. Samui Kumogakure", rank: "Senior Lecturer", dept: "PHY", coursesCurrent: ["PHY 412","PHY 414"], imageInitials: "SK", colorClass: "bg-[#8B4A3D]" },
    { id: "lec-phy-14", staffId: "FEDKO/SCI/PHY/014", name: "Prof. Ay Raikage", rank: "Professor", dept: "PHY", coursesCurrent: ["PHY 416","PHY 423"], imageInitials: "AR", colorClass: "bg-[#8B5A4D]" },
    { id: "lec-phy-15", staffId: "FEDKO/SCI/PHY/015", name: "Mr. Cee Kumogakure", rank: "Graduate Assistant", dept: "PHY", coursesCurrent: ["PHY 492"], imageInitials: "CK", colorClass: "bg-[#4A3D8F]" },
    { id: "lec-phy-16", staffId: "FEDKO/SCI/PHY/016", name: "Dr. Fu Takigakure", rank: "Lecturer II", dept: "PHY", coursesCurrent: ["PHY 418","PHY 422"], imageInitials: "FT", colorClass: "bg-[#5C7A8A]" },
  ],
  CSC: [
    { id: "lec-csc-01", staffId: "FEDKO/SCI/CSC/001", name: "Prof. Shikamaru Nara", rank: "Professor", dept: "CSC", coursesCurrent: ["CSC 411","CSC 415","CSC 491"], imageInitials: "SN", colorClass: "bg-[#3D5E3A]" },
    { id: "lec-csc-02", staffId: "FEDKO/SCI/CSC/002", name: "Dr. Temari Nara", rank: "Associate Professor", dept: "CSC", coursesCurrent: ["CSC 311","CSC 313"], imageInitials: "TN", colorClass: "bg-[#A0522D]" },
    { id: "lec-csc-03", staffId: "FEDKO/SCI/CSC/003", name: "Dr. Naruto Uzumaki", rank: "Senior Lecturer", dept: "CSC", coursesCurrent: ["CSC 211","CSC 213"], imageInitials: "NU", colorClass: "bg-[#6E5A7E]" },
    { id: "lec-csc-04", staffId: "FEDKO/SCI/CSC/004", name: "Mr. Konohamaru Sarutobi", rank: "Lecturer I", dept: "CSC", coursesCurrent: ["CSC 101","CSC 103"], imageInitials: "KS", colorClass: "bg-[#7A6B45]" },
    { id: "lec-csc-05", staffId: "FEDKO/SCI/CSC/005", name: "Mrs. Moegi Kazamatsuri", rank: "Lecturer I", dept: "CSC", coursesCurrent: ["CSC 102","CSC 104"], imageInitials: "MK", colorClass: "bg-[#5B4636]" },
    { id: "lec-csc-06", staffId: "FEDKO/SCI/CSC/006", name: "Dr. Udon Sarutobi", rank: "Senior Lecturer", dept: "CSC", coursesCurrent: ["CSC 315","CSC 317"], imageInitials: "US", colorClass: "bg-[#2A1F5E]" },
    { id: "lec-csc-07", staffId: "FEDKO/SCI/CSC/007", name: "Dr. Boruto Uzumaki", rank: "Lecturer I", dept: "CSC", coursesCurrent: ["CSC 312","CSC 314"], imageInitials: "BU", colorClass: "bg-[#BD5B2C]" },
    { id: "lec-csc-08", staffId: "FEDKO/SCI/CSC/008", name: "Mr. Sarada Uchiha", rank: "Lecturer II", dept: "CSC", coursesCurrent: ["CSC 319","CSC 321"], imageInitials: "SU2", colorClass: "bg-[#4F7A4B]" },
    { id: "lec-csc-09", staffId: "FEDKO/SCI/CSC/009", name: "Mr. Mitsuki Orochimaru", rank: "Lecturer II", dept: "CSC", coursesCurrent: ["CSC 412","CSC 414"], imageInitials: "MO", colorClass: "bg-[#6B5298]" },
    { id: "lec-csc-10", staffId: "FEDKO/SCI/CSC/010", name: "Dr. Kawaki Uzumaki", rank: "Lecturer I", dept: "CSC", coursesCurrent: ["CSC 413","CSC 415"], imageInitials: "KU2", colorClass: "bg-[#B8862A]" },
    { id: "lec-csc-11", staffId: "FEDKO/SCI/CSC/011", name: "Ms. Himawari Uzumaki", rank: "Assistant Lecturer", dept: "CSC", coursesCurrent: ["CSC 219","CSC 220"], imageInitials: "HU", colorClass: "bg-[#8B4A3D]" },
    { id: "lec-csc-12", staffId: "FEDKO/SCI/CSC/012", name: "Mr. Inojin Yamanaka", rank: "Assistant Lecturer", dept: "CSC", coursesCurrent: ["CSC 322","CSC 324"], imageInitials: "IY2", colorClass: "bg-[#8B5A4D]" },
    { id: "lec-csc-13", staffId: "FEDKO/SCI/CSC/013", name: "Dr. Chocho Akimichi", rank: "Senior Lecturer", dept: "CSC", coursesCurrent: ["CSC 416","CSC 418"], imageInitials: "CA", colorClass: "bg-[#4A3D8F]" },
    { id: "lec-csc-14", staffId: "FEDKO/SCI/CSC/014", name: "Prof. Shino Aburame-CS", rank: "Professor", dept: "CSC", coursesCurrent: ["CSC 421","CSC 423"], imageInitials: "SAb", colorClass: "bg-[#5C7A8A]" },
    { id: "lec-csc-15", staffId: "FEDKO/SCI/CSC/015", name: "Dr. Rock Lee Jr", rank: "Associate Professor", dept: "CSC", coursesCurrent: ["CSC 316","CSC 318"], imageInitials: "RL2", colorClass: "bg-[#3D5E3A]" },
    { id: "lec-csc-16", staffId: "FEDKO/SCI/CSC/016", name: "Mr. Metal Lee", rank: "Graduate Assistant", dept: "CSC", coursesCurrent: ["CSC 492"], imageInitials: "ML", colorClass: "bg-[#A0522D]" },
    { id: "lec-csc-17", staffId: "FEDKO/SCI/CSC/017", name: "Dr. Tsubaki Kurotuchi", rank: "Lecturer I", dept: "CSC", coursesCurrent: ["CSC 417","CSC 419"], imageInitials: "TK", colorClass: "bg-[#6E5A7E]" },
    { id: "lec-csc-18", staffId: "FEDKO/SCI/CSC/018", name: "Mr. Denki Kaminarimon", rank: "Lecturer II", dept: "CSC", coursesCurrent: ["CSC 420","CSC 422"], imageInitials: "DK", colorClass: "bg-[#7A6B45]" },
  ],
  BCH: [
    { id: "lec-bch-01", staffId: "FEDKO/SCI/BCH/001", name: "Dr. Sakura Haruno", rank: "Associate Professor", dept: "BCH", coursesCurrent: ["BCH 311","BCH 313","BCH 315"], imageInitials: "SH", colorClass: "bg-[#5B4636]" },
    { id: "lec-bch-02", staffId: "FEDKO/SCI/BCH/002", name: "Prof. Tsunade Senju", rank: "Professor", dept: "BCH", coursesCurrent: ["BCH 411","BCH 413"], imageInitials: "TS", colorClass: "bg-[#2A1F5E]" },
    { id: "lec-bch-03", staffId: "FEDKO/SCI/BCH/003", name: "Dr. Shizune Kato", rank: "Senior Lecturer", dept: "BCH", coursesCurrent: ["BCH 211","BCH 213"], imageInitials: "SK", colorClass: "bg-[#BD5B2C]" },
    { id: "lec-bch-04", staffId: "FEDKO/SCI/BCH/004", name: "Mr. Kabuto Yakushi", rank: "Lecturer I", dept: "BCH", coursesCurrent: ["BCH 101","BCH 102"], imageInitials: "KY", colorClass: "bg-[#4F7A4B]" },
    { id: "lec-bch-05", staffId: "FEDKO/SCI/BCH/005", name: "Dr. Ino Yamanaka-BCH", rank: "Lecturer I", dept: "BCH", coursesCurrent: ["BCH 215","BCH 217"], imageInitials: "IYb", colorClass: "bg-[#6B5298]" },
    { id: "lec-bch-06", staffId: "FEDKO/SCI/BCH/006", name: "Dr. Kurenai Yuhi-BCH", rank: "Senior Lecturer", dept: "BCH", coursesCurrent: ["BCH 311","BCH 317"], imageInitials: "KYb", colorClass: "bg-[#B8862A]" },
    { id: "lec-bch-07", staffId: "FEDKO/SCI/BCH/007", name: "Mr. Hidan Jashin", rank: "Lecturer II", dept: "BCH", coursesCurrent: ["BCH 319","BCH 321"], imageInitials: "HJ", colorClass: "bg-[#8B4A3D]" },
    { id: "lec-bch-08", staffId: "FEDKO/SCI/BCH/008", name: "Mr. Kakuzu Takigakure", rank: "Lecturer II", dept: "BCH", coursesCurrent: ["BCH 212","BCH 214"], imageInitials: "KT", colorClass: "bg-[#8B5A4D]" },
    { id: "lec-bch-09", staffId: "FEDKO/SCI/BCH/009", name: "Dr. Deidara Iwagakure", rank: "Lecturer I", dept: "BCH", coursesCurrent: ["BCH 415","BCH 417"], imageInitials: "DI", colorClass: "bg-[#4A3D8F]" },
    { id: "lec-bch-10", staffId: "FEDKO/SCI/BCH/010", name: "Dr. Sasori Sunagakure", rank: "Lecturer I", dept: "BCH", coursesCurrent: ["BCH 312","BCH 314"], imageInitials: "SS", colorClass: "bg-[#5C7A8A]" },
    { id: "lec-bch-11", staffId: "FEDKO/SCI/BCH/011", name: "Ms. Konan Amegakure-BCH", rank: "Assistant Lecturer", dept: "BCH", coursesCurrent: ["BCH 219","BCH 220"], imageInitials: "KAb", colorClass: "bg-[#3D5E3A]" },
    { id: "lec-bch-12", staffId: "FEDKO/SCI/BCH/012", name: "Mr. Kisame Kirigakure", rank: "Lecturer II", dept: "BCH", coursesCurrent: ["BCH 316","BCH 318"], imageInitials: "KK", colorClass: "bg-[#A0522D]" },
    { id: "lec-bch-13", staffId: "FEDKO/SCI/BCH/013", name: "Dr. Zetsu Gedo", rank: "Senior Lecturer", dept: "BCH", coursesCurrent: ["BCH 420","BCH 422"], imageInitials: "ZG", colorClass: "bg-[#6E5A7E]" },
    { id: "lec-bch-14", staffId: "FEDKO/SCI/BCH/014", name: "Prof. Nagato Uzumaki", rank: "Professor", dept: "BCH", coursesCurrent: ["BCH 412","BCH 414"], imageInitials: "NU2", colorClass: "bg-[#7A6B45]" },
    { id: "lec-bch-15", staffId: "FEDKO/SCI/BCH/015", name: "Mr. Yahiko Amegakure", rank: "Graduate Assistant", dept: "BCH", coursesCurrent: ["BCH 492"], imageInitials: "YA", colorClass: "bg-[#5B4636]" },
    { id: "lec-bch-16", staffId: "FEDKO/SCI/BCH/016", name: "Dr. Konan Pale", rank: "Associate Professor", dept: "BCH", coursesCurrent: ["BCH 491","BCH 423"], imageInitials: "KP2", colorClass: "bg-[#2A1F5E]" },
    { id: "lec-bch-17", staffId: "FEDKO/SCI/BCH/017", name: "Ms. Nagato Pain-BCH", rank: "Assistant Lecturer", dept: "BCH", coursesCurrent: ["BCH 323","BCH 324"], imageInitials: "NPb", colorClass: "bg-[#BD5B2C]" },
  ],
  MTH: [
    { id: "lec-mth-01", staffId: "FEDKO/SCI/MTH/001", name: "Prof. Neji Hyuga", rank: "Professor", dept: "MTH", coursesCurrent: ["MTH 411","MTH 413","MTH 491"], imageInitials: "NH", colorClass: "bg-[#4F7A4B]" },
    { id: "lec-mth-02", staffId: "FEDKO/SCI/MTH/002", name: "Dr. Hinata Hyuga-MTH", rank: "Associate Professor", dept: "MTH", coursesCurrent: ["MTH 311","MTH 315"], imageInitials: "HHm", colorClass: "bg-[#6B5298]" },
    { id: "lec-mth-03", staffId: "FEDKO/SCI/MTH/003", name: "Dr. Ino Yamanaka", rank: "Senior Lecturer", dept: "MTH", coursesCurrent: ["MTH 311","MTH 317","MTH 491"], imageInitials: "IY", colorClass: "bg-[#B8862A]" },
    { id: "lec-mth-04", staffId: "FEDKO/SCI/MTH/004", name: "Mr. Shikadai Nara", rank: "Lecturer I", dept: "MTH", coursesCurrent: ["MTH 101","MTH 103"], imageInitials: "ShN", colorClass: "bg-[#8B4A3D]" },
    { id: "lec-mth-05", staffId: "FEDKO/SCI/MTH/005", name: "Dr. Temari Sunagakure", rank: "Lecturer I", dept: "MTH", coursesCurrent: ["MTH 102","MTH 104"], imageInitials: "TS2", colorClass: "bg-[#8B5A4D]" },
    { id: "lec-mth-06", staffId: "FEDKO/SCI/MTH/006", name: "Dr. Gaara Sabaku", rank: "Senior Lecturer", dept: "MTH", coursesCurrent: ["MTH 211","MTH 213"], imageInitials: "GSb", colorClass: "bg-[#4A3D8F]" },
    { id: "lec-mth-07", staffId: "FEDKO/SCI/MTH/007", name: "Dr. Kankuro Sabaku", rank: "Lecturer I", dept: "MTH", coursesCurrent: ["MTH 215","MTH 217"], imageInitials: "KSb", colorClass: "bg-[#5C7A8A]" },
    { id: "lec-mth-08", staffId: "FEDKO/SCI/MTH/008", name: "Mr. Baki Sunagakure", rank: "Lecturer II", dept: "MTH", coursesCurrent: ["MTH 219","MTH 415"], imageInitials: "BS", colorClass: "bg-[#3D5E3A]" },
    { id: "lec-mth-09", staffId: "FEDKO/SCI/MTH/009", name: "Mr. Ebizo Sunagakure", rank: "Lecturer II", dept: "MTH", coursesCurrent: ["MTH 412","MTH 414"], imageInitials: "ES", colorClass: "bg-[#A0522D]" },
    { id: "lec-mth-10", staffId: "FEDKO/SCI/MTH/010", name: "Dr. Chiyo Sunagakure", rank: "Associate Professor", dept: "MTH", coursesCurrent: ["MTH 313","MTH 317"], imageInitials: "CS", colorClass: "bg-[#6E5A7E]" },
    { id: "lec-mth-11", staffId: "FEDKO/SCI/MTH/011", name: "Ms. Pakura Hotsprings", rank: "Assistant Lecturer", dept: "MTH", coursesCurrent: ["MTH 219","MTH 220"], imageInitials: "PH", colorClass: "bg-[#7A6B45]" },
    { id: "lec-mth-12", staffId: "FEDKO/SCI/MTH/012", name: "Mr. Han Iwagate", rank: "Assistant Lecturer", dept: "MTH", coursesCurrent: ["MTH 322","MTH 324"], imageInitials: "HI", colorClass: "bg-[#5B4636]" },
    { id: "lec-mth-13", staffId: "FEDKO/SCI/MTH/013", name: "Dr. Roshi Kazan", rank: "Senior Lecturer", dept: "MTH", coursesCurrent: ["MTH 416","MTH 418"], imageInitials: "RK", colorClass: "bg-[#2A1F5E]" },
    { id: "lec-mth-14", staffId: "FEDKO/SCI/MTH/014", name: "Prof. Yugito Nii", rank: "Professor", dept: "MTH", coursesCurrent: ["MTH 415","MTH 419"], imageInitials: "YN", colorClass: "bg-[#BD5B2C]" },
    { id: "lec-mth-15", staffId: "FEDKO/SCI/MTH/015", name: "Mr. Utakata Kirigakure", rank: "Graduate Assistant", dept: "MTH", coursesCurrent: ["MTH 492"], imageInitials: "UK", colorClass: "bg-[#4F7A4B]" },
    { id: "lec-mth-16", staffId: "FEDKO/SCI/MTH/016", name: "Dr. Fuu Takigakure", rank: "Lecturer I", dept: "MTH", coursesCurrent: ["MTH 420","MTH 421"], imageInitials: "FTm", colorClass: "bg-[#6B5298]" },
  ],
};

// Generic rosters for remaining depts (15 lecturers each, auto-generated)
const GENERIC_RANKS: Rank[] = ["Professor","Associate Professor","Senior Lecturer","Lecturer I","Lecturer I","Lecturer II","Lecturer II","Assistant Lecturer","Lecturer I","Lecturer I","Associate Professor","Senior Lecturer","Lecturer II","Graduate Assistant","Lecturer I"];

export function getGenericRoster(dept: string, count = 15): MinLecturer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `lec-${dept.toLowerCase()}-${String(i+1).padStart(2,"0")}`,
    staffId: `FEDKO/SCI/${dept}/${String(i+1).padStart(3,"0")}`,
    name: `${GENERIC_RANKS[i]} Staff ${dept}-${i+1}`,
    rank: GENERIC_RANKS[i],
    dept,
    coursesCurrent: [],
    imageInitials: `${dept[0]}${i+1}`,
    colorClass: "bg-[#B8862A]",
  }));
}

// Invigilation assignments — linked to exam slots
export interface InvigilationDuty {
  id: string;
  lecturerId: string;
  courseCode: string;
  courseTitle: string;
  date: string;        // e.g. "2024-11-14"
  startTime: string;   // "09:00"
  endTime: string;     // "11:00"
  venue: string;
  role: "Chief Invigilator" | "Invigilator" | "Relief Invigilator";
}

export const SAMPLE_INVIGILATION: InvigilationDuty[] = [
  { id: "inv-001", lecturerId: "lec-001", courseCode: "CHM 411", courseTitle: "Advanced Organic Chemistry", date: "2024-11-14", startTime: "09:00", endTime: "11:00", venue: "SCI Theatre 1", role: "Chief Invigilator" },
  { id: "inv-002", lecturerId: "lec-001", courseCode: "CHM 215", courseTitle: "Physical Chemistry I", date: "2024-11-18", startTime: "09:00", endTime: "11:00", venue: "SCI LH 2", role: "Invigilator" },
  { id: "inv-003", lecturerId: "lec-002", courseCode: "PHY 411", courseTitle: "Advanced Quantum Mechanics", date: "2024-11-15", startTime: "14:00", endTime: "16:00", venue: "SCI Theatre 2", role: "Chief Invigilator" },
  { id: "inv-004", lecturerId: "lec-003", courseCode: "CSC 411", courseTitle: "Advanced Algorithms", date: "2024-11-16", startTime: "09:00", endTime: "11:00", venue: "CSC Lab 1", role: "Chief Invigilator" },
  { id: "inv-005", lecturerId: "lec-004", courseCode: "BCH 311", courseTitle: "Molecular Biology I", date: "2024-11-19", startTime: "09:00", endTime: "11:00", venue: "SCI LH 3", role: "Chief Invigilator" },
  { id: "inv-006", lecturerId: "lec-005", courseCode: "MTH 311", courseTitle: "Functional Analysis", date: "2024-11-20", startTime: "14:00", endTime: "16:00", venue: "SCI LH 4", role: "Chief Invigilator" },
];
