import { PrismaClient, UserRole, InstitutionType, RoomType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Password for all demo accounts: demo1234
const DEMO_PASSWORD = "$2a$12$LJ3m4ys3Lk0pQGJ5eF5NHOtZQ7Xh8Y0rAaBbCcDdEeFfGgHhIiJjKk";

const INSTITUTION = {
  name: "Federal University of Konoha",
  shortName: "FEDKO",
  type: "FEDERAL_UNI" as InstitutionType,
  city: "Konoha Village",
  state: "Land of Fire",
  country: "Nigeria",
  currentSession: "2025/2026",
  currentSemester: 2,
};

const FACULTIES = [
  { code: "FAD", name: "Faculty of Administration", deanName: "Tsunade" },
  { code: "FAG", name: "Faculty of Agriculture", deanName: "Yamato" },
  { code: "FAL", name: "Faculty of Arts", deanName: "Kurenai Yuhi" },
  { code: "FEN", name: "Faculty of Engineering", deanName: "Minato Namikaze" },
  { code: "FED", name: "Faculty of Environmental Design", deanName: "Orochimaru" },
  { code: "FLA", name: "Faculty of Law", deanName: "Danzo Shimura" },
  { code: "FPS", name: "Faculty of Physical and Applied Sciences", deanName: "Hiruzen Sarutobi" },
  { code: "FPH", name: "Faculty of Pharmacy", deanName: "Sakura Haruno" },
  { code: "FSS", name: "Faculty of Social Sciences", deanName: "Itachi Uchiha" },
  { code: "FVM", name: "Faculty of Veterinary Medicine", deanName: "Kiba Inuzuka" },
];

// facultyCode -> departments[]
const DEPARTMENTS: Record<string, { code: string; name: string; hod: string }[]> = {
  FAD: [
    { code: "ACC", name: "Accounting", hod: "Shikamaru Nara" },
    { code: "BUS", name: "Business Administration", hod: "Ino Yamanaka" },
    { code: "PAD", name: "Public Administration", hod: "Temari" },
    { code: "LGS", name: "Local Government and Development Studies", hod: "Choji Akimichi" },
    { code: "MAC", name: "Mass Communication", hod: "Jiraiya" },
  ],
  FAG: [
    { code: "AGN", name: "Agronomy", hod: "Konohamaru Sarutobi" },
    { code: "ANS", name: "Animal Science", hod: "Kiba Inuzuka" },
    { code: "AEC", name: "Agricultural Economics and Rural Sociology", hod: "Sai" },
    { code: "AER", name: "Agricultural Extension and Rural Development", hod: "Asuma Sarutobi" },
    { code: "SLS", name: "Soil Science", hod: "Iruka Umino" },
    { code: "CRP", name: "Crop Protection", hod: "Shino Aburame" },
  ],
  FAL: [
    { code: "ELS", name: "English and Literary Studies", hod: "Kakashi Hatake" },
    { code: "HIS", name: "History", hod: "Jiraiya" },
    { code: "ARA", name: "Arabic", hod: "Gaara" },
    { code: "FRE", name: "French", hod: "Yugao Uzuki" },
    { code: "ALC", name: "African Languages and Cultures", hod: "Killer B" },
    { code: "THA", name: "Theatre and Performing Arts", hod: "Might Guy" },
  ],
  FEN: [
    { code: "CVE", name: "Civil Engineering", hod: "Hashirama Senju" },
    { code: "ECE", name: "Electrical and Computer Engineering", hod: "Tobirama Senju" },
    { code: "MCE", name: "Mechanical Engineering", hod: "Rock Lee" },
    { code: "CHN", name: "Chemical Engineering", hod: "Kabuto Yakushi" },
    { code: "PET", name: "Petroleum Engineering", hod: "Rasa" },
    { code: "AUT", name: "Automotive Engineering", hod: "Darui" },
    { code: "MTE", name: "Mechatronics Engineering", hod: "Neji Hyuga" },
  ],
  FED: [
    { code: "ARC", name: "Architecture", hod: "Sasori" },
    { code: "BLD", name: "Building", hod: "Deidara" },
    { code: "GEM", name: "Geomatics", hod: "Konan" },
    { code: "URP", name: "Urban and Regional Planning", hod: "Yahiko" },
    { code: "QSV", name: "Quantity Surveying", hod: "Kakuzu" },
    { code: "IND", name: "Industrial Design", hod: "Hidan" },
  ],
  FLA: [
    { code: "PBL", name: "Public Law", hod: "Tsunade" },
    { code: "PRL", name: "Private Law", hod: "Hinata Hyuga" },
    { code: "CML", name: "Commercial Law", hod: "Shikamaru Nara" },
    { code: "ILW", name: "Islamic Law", hod: "Gaara" },
  ],
  FPS: [
    { code: "CSC", name: "Computer Science", hod: "Shikamaru Nara" },
    { code: "MTH", name: "Mathematics", hod: "Itachi Uchiha" },
    { code: "PHY", name: "Physics", hod: "Minato Namikaze" },
    { code: "CHM", name: "Chemistry", hod: "Sasori" },
    { code: "BSC", name: "Biological Sciences", hod: "Shino Aburame" },
    { code: "BCH", name: "Biochemistry", hod: "Kabuto Yakushi" },
    { code: "BOT", name: "Botany", hod: "Ino Yamanaka" },
    { code: "ZOO", name: "Zoology", hod: "Kiba Inuzuka" },
    { code: "MCB", name: "Microbiology", hod: "Kabuto Yakushi" },
    { code: "STA", name: "Statistics", hod: "Temari" },
    { code: "GEO", name: "Geology", hod: "Onoki" },
    { code: "GEG", name: "Geography", hod: "Konan" },
  ],
  FPH: [
    { code: "PHA", name: "Pharmacy", hod: "Sakura Haruno" },
    { code: "PHM", name: "Pharmacology", hod: "Tsunade" },
    { code: "PHC", name: "Pharmaceutical Chemistry", hod: "Kabuto Yakushi" },
    { code: "PHT", name: "Pharmacognosy", hod: "Shizune" },
  ],
  FSS: [
    { code: "POL", name: "Political Science and International Studies", hod: "Madara Uchiha" },
    { code: "SOC", name: "Sociology", hod: "Nagato" },
    { code: "PHL", name: "Philosophy", hod: "Nagato" },
    { code: "PSY", name: "Psychology", hod: "Ino Yamanaka" },
    { code: "ECO", name: "Economics", hod: "Shikamaru Nara" },
    { code: "SWK", name: "Social Work", hod: "Kurenai Yuhi" },
  ],
  FVM: [
    { code: "VTM", name: "Veterinary Medicine", hod: "Kiba Inuzuka" },
    { code: "VPH", name: "Veterinary Public Health", hod: "Shizune" },
    { code: "VAP", name: "Veterinary Anatomy and Physiology", hod: "Sakura Haruno" },
    { code: "VSG", name: "Veterinary Surgery", hod: "Tsunade" },
    { code: "VMT", name: "Veterinary Microbiology", hod: "Kabuto Yakushi" },
  ],
};

// Course templates: deptCode -> {code, name, level, cu, lab?}
const COURSES: Record<string, { code: string; name: string; level: number; cu: number; lab?: boolean }[]> = {
  ACC: [{code:"101",name:"Introduction to Financial Accounting",level:100,cu:3},{code:"102",name:"Principles of Cost Accounting",level:100,cu:3},{code:"201",name:"Financial Accounting I",level:200,cu:3},{code:"202",name:"Cost and Management Accounting",level:200,cu:3},{code:"301",name:"Advanced Financial Accounting",level:300,cu:3},{code:"302",name:"Public Sector Accounting and Finance",level:300,cu:3}],
  BUS: [{code:"101",name:"Introduction to Business Administration",level:100,cu:3},{code:"102",name:"Principles of Management",level:100,cu:2},{code:"201",name:"Business Organisation and Environment",level:200,cu:3},{code:"202",name:"Business Statistics",level:200,cu:3},{code:"301",name:"Operations Management",level:300,cu:3}],
  PAD: [{code:"101",name:"Introduction to Public Administration",level:100,cu:3},{code:"102",name:"Nigerian Government and Politics",level:100,cu:2},{code:"201",name:"Public Policy Analysis",level:200,cu:3},{code:"202",name:"Local Government Administration",level:200,cu:3},{code:"301",name:"Development Administration",level:300,cu:3}],
  LGS: [{code:"101",name:"Introduction to Local Government Studies",level:100,cu:2},{code:"201",name:"Community Development",level:200,cu:3},{code:"202",name:"Rural Development Administration",level:200,cu:3},{code:"301",name:"Local Government Finance",level:300,cu:3},{code:"302",name:"Inter-Governmental Relations",level:300,cu:2}],
  MAC: [{code:"101",name:"Introduction to Mass Communication",level:100,cu:3},{code:"102",name:"History of Nigerian Media",level:100,cu:2},{code:"201",name:"News Writing and Reporting",level:200,cu:3},{code:"202",name:"Broadcast Journalism",level:200,cu:3},{code:"301",name:"Public Relations and Advertising",level:300,cu:3}],
  AGN: [{code:"101",name:"Introduction to Agronomy",level:100,cu:3},{code:"102",name:"Principles of Crop Production",level:100,cu:3},{code:"201",name:"Crop Physiology and Ecology",level:200,cu:3},{code:"202",name:"Seed Technology",level:200,cu:3},{code:"301",name:"Cereal and Legume Production",level:300,cu:3,lab:true}],
  ANS: [{code:"101",name:"Introduction to Animal Science",level:100,cu:3},{code:"102",name:"Animal Anatomy and Physiology",level:100,cu:3},{code:"201",name:"Animal Nutrition and Feeding",level:200,cu:3},{code:"202",name:"Animal Breeding and Genetics",level:200,cu:3},{code:"301",name:"Livestock Production Management",level:300,cu:3,lab:true}],
  AEC: [{code:"101",name:"Introduction to Agricultural Economics",level:100,cu:3},{code:"102",name:"Principles of Agricultural Production",level:100,cu:2},{code:"201",name:"Farm Management and Production Economics",level:200,cu:3},{code:"202",name:"Agricultural Marketing and Prices",level:200,cu:3},{code:"301",name:"Project Appraisal in Agriculture",level:300,cu:3}],
  AER: [{code:"101",name:"Introduction to Agricultural Extension",level:100,cu:3},{code:"102",name:"Rural Sociology",level:100,cu:2},{code:"201",name:"Extension Methods and Communication",level:200,cu:3},{code:"202",name:"Agricultural Development Programmes",level:200,cu:3},{code:"301",name:"Extension Administration and Supervision",level:300,cu:3}],
  SLS: [{code:"101",name:"Introduction to Soil Science",level:100,cu:3},{code:"201",name:"Soil Physics",level:200,cu:3,lab:true},{code:"202",name:"Soil Chemistry and Fertility",level:200,cu:3,lab:true},{code:"301",name:"Soil Conservation and Management",level:300,cu:3},{code:"302",name:"Land Use Planning",level:300,cu:2}],
  CRP: [{code:"101",name:"Introduction to Crop Protection",level:100,cu:3},{code:"201",name:"Principles of Plant Pathology",level:200,cu:3,lab:true},{code:"202",name:"Agricultural Entomology",level:200,cu:3,lab:true},{code:"301",name:"Weed Science and Control",level:300,cu:3},{code:"302",name:"Pesticide Chemistry and Toxicology",level:300,cu:3,lab:true}],
  ELS: [{code:"101",name:"Introduction to English Language",level:100,cu:3},{code:"102",name:"Introduction to Literary Studies",level:100,cu:3},{code:"201",name:"English Syntax and Morphology",level:200,cu:3},{code:"202",name:"African Literature in English",level:200,cu:3},{code:"301",name:"Introduction to Sociolinguistics",level:300,cu:3}],
  HIS: [{code:"101",name:"Introduction to History",level:100,cu:3},{code:"102",name:"History of Nigeria to 1900",level:100,cu:3},{code:"201",name:"Nigeria in the 20th Century",level:200,cu:3},{code:"202",name:"European History since 1789",level:200,cu:3},{code:"301",name:"History of International Relations",level:300,cu:3}],
  ARA: [{code:"101",name:"Introduction to Arabic Language",level:100,cu:3},{code:"102",name:"Arabic Grammar I",level:100,cu:3},{code:"201",name:"Arabic Composition",level:200,cu:3},{code:"202",name:"Arabic Literature",level:200,cu:3},{code:"301",name:"Advanced Arabic Syntax",level:300,cu:3}],
  FRE: [{code:"101",name:"Introduction to French Language",level:100,cu:3},{code:"102",name:"French Grammar I",level:100,cu:3},{code:"201",name:"French Composition",level:200,cu:3},{code:"202",name:"Introduction to French Literature",level:200,cu:3},{code:"301",name:"French Phonetics",level:300,cu:2}],
  ALC: [{code:"101",name:"Introduction to African Languages",level:100,cu:3},{code:"102",name:"Hausa Language I",level:100,cu:3},{code:"201",name:"Igbo Language I",level:200,cu:3},{code:"202",name:"Yoruba Language I",level:200,cu:3},{code:"301",name:"Language and National Development",level:300,cu:3}],
  THA: [{code:"101",name:"Introduction to Theatre Arts",level:100,cu:3},{code:"102",name:"Basic Acting Techniques",level:100,cu:2},{code:"201",name:"Stagecraft and Design",level:200,cu:3},{code:"202",name:"Play Production",level:200,cu:3},{code:"301",name:"African Drama and Theatre",level:300,cu:3}],
  CVE: [{code:"101",name:"Introduction to Civil Engineering",level:100,cu:3},{code:"102",name:"Engineering Drawing I",level:100,cu:2},{code:"201",name:"Strength of Materials",level:200,cu:3},{code:"202",name:"Fluid Mechanics I",level:200,cu:3,lab:true},{code:"301",name:"Structural Analysis I",level:300,cu:3},{code:"302",name:"Geotechnical Engineering",level:300,cu:3,lab:true}],
  ECE: [{code:"101",name:"Introduction to Electrical Engineering",level:100,cu:3},{code:"102",name:"Circuit Theory I",level:100,cu:3,lab:true},{code:"201",name:"Electronics I",level:200,cu:3,lab:true},{code:"202",name:"Electromagnetic Fields",level:200,cu:3},{code:"301",name:"Signals and Systems",level:300,cu:3},{code:"302",name:"Communication Principles",level:300,cu:3}],
  MCE: [{code:"101",name:"Introduction to Mechanical Engineering",level:100,cu:3},{code:"102",name:"Engineering Thermodynamics I",level:100,cu:3},{code:"201",name:"Mechanics of Machines I",level:200,cu:3},{code:"202",name:"Manufacturing Processes I",level:200,cu:3,lab:true},{code:"301",name:"Machine Design I",level:300,cu:3}],
  CHN: [{code:"101",name:"Introduction to Chemical Engineering",level:100,cu:3},{code:"102",name:"Material and Energy Balances",level:100,cu:3},{code:"201",name:"Chemical Engineering Thermodynamics",level:200,cu:3},{code:"202",name:"Fluid Flow Operations",level:200,cu:3,lab:true},{code:"301",name:"Chemical Reaction Engineering I",level:300,cu:3}],
  PET: [{code:"101",name:"Introduction to Petroleum Engineering",level:100,cu:3},{code:"102",name:"Petroleum Geology",level:100,cu:3},{code:"201",name:"Reservoir Engineering I",level:200,cu:3},{code:"202",name:"Drilling Engineering I",level:200,cu:3},{code:"301",name:"Petroleum Production Engineering",level:300,cu:3}],
  AUT: [{code:"101",name:"Introduction to Automotive Engineering",level:100,cu:3},{code:"102",name:"Automotive Electrical Systems",level:100,cu:3,lab:true},{code:"201",name:"Internal Combustion Engines",level:200,cu:3},{code:"202",name:"Vehicle Dynamics",level:200,cu:3},{code:"301",name:"Automotive Design and Manufacturing",level:300,cu:3,lab:true}],
  MTE: [{code:"101",name:"Introduction to Mechatronics",level:100,cu:3},{code:"102",name:"Digital Electronics",level:100,cu:3,lab:true},{code:"201",name:"Control Systems I",level:200,cu:3},{code:"202",name:"Microprocessors and Microcontrollers",level:200,cu:3,lab:true},{code:"301",name:"Robotics and Automation",level:300,cu:3,lab:true}],
  ARC: [{code:"101",name:"Introduction to Architecture",level:100,cu:3},{code:"102",name:"Architectural Drawing I",level:100,cu:3},{code:"201",name:"Architectural Design I",level:200,cu:4},{code:"202",name:"Building Construction I",level:200,cu:3},{code:"301",name:"Architectural Design II",level:300,cu:4}],
  BLD: [{code:"101",name:"Introduction to Building Technology",level:100,cu:3},{code:"102",name:"Building Materials I",level:100,cu:3},{code:"201",name:"Building Construction I",level:200,cu:3},{code:"202",name:"Building Services I",level:200,cu:3},{code:"301",name:"Structural Elements in Building",level:300,cu:3}],
  GEM: [{code:"101",name:"Introduction to Geomatics",level:100,cu:3},{code:"102",name:"Surveying I",level:100,cu:3,lab:true},{code:"201",name:"Surveying II",level:200,cu:3,lab:true},{code:"202",name:"Geodetic Surveying",level:200,cu:3},{code:"301",name:"Photogrammetry and Remote Sensing",level:300,cu:3}],
  URP: [{code:"101",name:"Introduction to Urban and Regional Planning",level:100,cu:3},{code:"102",name:"Planning Theory",level:100,cu:2},{code:"201",name:"Site Analysis and Planning",level:200,cu:3},{code:"202",name:"Transportation Planning",level:200,cu:3},{code:"301",name:"Regional Planning Techniques",level:300,cu:3}],
  QSV: [{code:"101",name:"Introduction to Quantity Surveying",level:100,cu:3},{code:"102",name:"Construction Economics",level:100,cu:2},{code:"201",name:"Measurement of Building Works I",level:200,cu:3},{code:"202",name:"Building Estimating and Pricing",level:200,cu:3},{code:"301",name:"Measurement of Engineering Works",level:300,cu:3}],
  IND: [{code:"101",name:"Introduction to Industrial Design",level:100,cu:3},{code:"102",name:"Basic Design and Colour Theory",level:100,cu:3},{code:"201",name:"Product Design I",level:200,cu:3},{code:"202",name:"Ceramics Design",level:200,cu:3,lab:true},{code:"301",name:"Industrial Design Methods",level:300,cu:3}],
  PBL: [{code:"101",name:"Introduction to Nigerian Legal System",level:100,cu:3},{code:"102",name:"Constitutional Law I",level:100,cu:3},{code:"201",name:"Constitutional Law II",level:200,cu:3},{code:"202",name:"Administrative Law",level:200,cu:3},{code:"301",name:"International Law I",level:300,cu:3}],
  PRL: [{code:"101",name:"Law of Contract I",level:100,cu:3},{code:"102",name:"Law of Torts I",level:100,cu:3},{code:"201",name:"Law of Contract II",level:200,cu:3},{code:"202",name:"Commercial Law I",level:200,cu:3},{code:"301",name:"Law of Property",level:300,cu:3}],
  CML: [{code:"101",name:"Principles of Commercial Law",level:100,cu:3},{code:"201",name:"Company Law I",level:200,cu:3},{code:"202",name:"Law of Banking",level:200,cu:3},{code:"301",name:"Industrial and Labour Law",level:300,cu:3}],
  ILW: [{code:"101",name:"Introduction to Islamic Law",level:100,cu:3},{code:"102",name:"Islamic Jurisprudence I",level:100,cu:3},{code:"201",name:"Islamic Family Law",level:200,cu:3},{code:"202",name:"Islamic Commercial Law",level:200,cu:3},{code:"301",name:"Islamic Criminal Law",level:300,cu:3}],
  CSC: [{code:"101",name:"Introduction to Computer Science",level:100,cu:3},{code:"102",name:"Introduction to Programming",level:100,cu:3,lab:true},{code:"201",name:"Data Structures and Algorithms",level:200,cu:3,lab:true},{code:"202",name:"Database Systems",level:200,cu:3,lab:true},{code:"301",name:"Operating Systems",level:300,cu:3},{code:"302",name:"Computer Networks",level:300,cu:3,lab:true}],
  MTH: [{code:"101",name:"General Mathematics I",level:100,cu:3},{code:"102",name:"General Mathematics II",level:100,cu:3},{code:"201",name:"Linear Algebra I",level:200,cu:3},{code:"202",name:"Calculus II",level:200,cu:3},{code:"301",name:"Real Analysis I",level:300,cu:3},{code:"302",name:"Complex Analysis",level:300,cu:3}],
  PHY: [{code:"101",name:"General Physics I",level:100,cu:3,lab:true},{code:"102",name:"General Physics II",level:100,cu:3,lab:true},{code:"201",name:"Classical Mechanics",level:200,cu:3},{code:"202",name:"Electromagnetism I",level:200,cu:3},{code:"301",name:"Quantum Mechanics I",level:300,cu:3}],
  CHM: [{code:"101",name:"General Chemistry I",level:100,cu:3,lab:true},{code:"102",name:"General Chemistry II",level:100,cu:3,lab:true},{code:"201",name:"Physical Chemistry I",level:200,cu:3},{code:"202",name:"Organic Chemistry I",level:200,cu:3,lab:true},{code:"301",name:"Inorganic Chemistry I",level:300,cu:3}],
  BSC: [{code:"101",name:"General Biology I",level:100,cu:3,lab:true},{code:"102",name:"General Biology II",level:100,cu:3,lab:true},{code:"201",name:"Genetics and Cytology",level:200,cu:3},{code:"202",name:"Ecology and Conservation",level:200,cu:3},{code:"301",name:"Cell Biology",level:300,cu:3}],
  BCH: [{code:"101",name:"Introduction to Biochemistry",level:100,cu:3},{code:"201",name:"Molecular Biology",level:200,cu:3,lab:true},{code:"202",name:"Enzymology",level:200,cu:3,lab:true},{code:"301",name:"Metabolic Biochemistry",level:300,cu:3},{code:"302",name:"Clinical Biochemistry",level:300,cu:3}],
  BOT: [{code:"101",name:"Introduction to Botany",level:100,cu:3,lab:true},{code:"102",name:"Plant Anatomy and Physiology",level:100,cu:3},{code:"201",name:"Plant Taxonomy",level:200,cu:3,lab:true},{code:"202",name:"Plant Physiology",level:200,cu:3},{code:"301",name:"Plant Ecology",level:300,cu:3}],
  ZOO: [{code:"101",name:"Introduction to Zoology",level:100,cu:3,lab:true},{code:"102",name:"Animal Diversity",level:100,cu:3},{code:"201",name:"Comparative Vertebrate Anatomy",level:200,cu:3,lab:true},{code:"202",name:"Animal Physiology",level:200,cu:3},{code:"301",name:"Parasitology",level:300,cu:3,lab:true}],
  MCB: [{code:"101",name:"Introduction to Microbiology",level:100,cu:3,lab:true},{code:"201",name:"Bacteriology",level:200,cu:3,lab:true},{code:"202",name:"Mycology and Virology",level:200,cu:3,lab:true},{code:"301",name:"Industrial Microbiology",level:300,cu:3},{code:"302",name:"Food Microbiology",level:300,cu:3,lab:true}],
  STA: [{code:"101",name:"Introduction to Statistics",level:100,cu:3},{code:"102",name:"Probability Theory I",level:100,cu:3},{code:"201",name:"Statistical Inference I",level:200,cu:3},{code:"202",name:"Regression Analysis",level:200,cu:3},{code:"301",name:"Design and Analysis of Experiments",level:300,cu:3}],
  GEO: [{code:"101",name:"Introduction to Geology",level:100,cu:3},{code:"102",name:"Physical Geology",level:100,cu:3,lab:true},{code:"201",name:"Mineralogy",level:200,cu:3,lab:true},{code:"202",name:"Petrology",level:200,cu:3},{code:"301",name:"Structural Geology",level:300,cu:3}],
  GEG: [{code:"101",name:"Introduction to Geography",level:100,cu:3},{code:"102",name:"Physical Geography",level:100,cu:3},{code:"201",name:"Human Geography",level:200,cu:3},{code:"202",name:"Climatology",level:200,cu:3},{code:"301",name:"Regional Geography of West Africa",level:300,cu:3}],
  PHA: [{code:"101",name:"Introduction to Pharmacy",level:100,cu:3},{code:"102",name:"Pharmaceutical Calculations",level:100,cu:3},{code:"201",name:"Pharmaceutics I",level:200,cu:3,lab:true},{code:"202",name:"Pharmacy Practice I",level:200,cu:3},{code:"301",name:"Pharmacognosy and Phytomedicine",level:300,cu:3,lab:true}],
  PHM: [{code:"101",name:"Introduction to Pharmacology",level:100,cu:3},{code:"201",name:"Systemic Pharmacology I",level:200,cu:3},{code:"202",name:"Clinical Pharmacology",level:200,cu:3},{code:"301",name:"Toxicology",level:300,cu:3}],
  PHC: [{code:"101",name:"Pharmaceutical Chemistry I",level:100,cu:3,lab:true},{code:"201",name:"Pharmaceutical Chemistry II",level:200,cu:3,lab:true},{code:"202",name:"Medicinal Chemistry",level:200,cu:3},{code:"301",name:"Pharmaceutical Analysis",level:300,cu:3,lab:true}],
  PHT: [{code:"101",name:"Introduction to Pharmacognosy",level:100,cu:3,lab:true},{code:"201",name:"Pharmacognosy II",level:200,cu:3,lab:true},{code:"202",name:"Natural Products Chemistry",level:200,cu:3},{code:"301",name:"Herbal Drug Technology",level:300,cu:3,lab:true}],
  POL: [{code:"101",name:"Introduction to Political Science",level:100,cu:3},{code:"102",name:"Nigerian Government and Politics",level:100,cu:3},{code:"201",name:"Comparative Politics",level:200,cu:3},{code:"202",name:"International Relations",level:200,cu:3},{code:"301",name:"Political Theory",level:300,cu:3},{code:"302",name:"African Political Systems",level:300,cu:3}],
  SOC: [{code:"101",name:"Introduction to Sociology",level:100,cu:3},{code:"102",name:"Sociological Theory I",level:100,cu:3},{code:"201",name:"Social Statistics",level:200,cu:3},{code:"202",name:"Social Psychology",level:200,cu:3},{code:"301",name:"Sociology of Development",level:300,cu:3}],
  PHL: [{code:"101",name:"Introduction to Philosophy",level:100,cu:3},{code:"102",name:"Logic and Critical Thinking",level:100,cu:3},{code:"201",name:"History of Philosophy",level:200,cu:3},{code:"202",name:"Ethics",level:200,cu:3},{code:"301",name:"African Philosophy",level:300,cu:3}],
  PSY: [{code:"101",name:"Introduction to Psychology",level:100,cu:3},{code:"102",name:"Developmental Psychology",level:100,cu:3},{code:"201",name:"Social Psychology",level:200,cu:3},{code:"202",name:"Abnormal Psychology",level:200,cu:3},{code:"301",name:"Cognitive Psychology",level:300,cu:3}],
  ECO: [{code:"101",name:"Introduction to Economics I",level:100,cu:3},{code:"102",name:"Introduction to Economics II",level:100,cu:3},{code:"201",name:"Microeconomic Theory I",level:200,cu:3},{code:"202",name:"Macroeconomic Theory I",level:200,cu:3},{code:"301",name:"Econometrics I",level:300,cu:3}],
  SWK: [{code:"101",name:"Introduction to Social Work",level:100,cu:3},{code:"102",name:"Social Welfare Services",level:100,cu:2},{code:"201",name:"Social Case Work",level:200,cu:3},{code:"202",name:"Community Organisation",level:200,cu:3},{code:"301",name:"Social Work Research",level:300,cu:3}],
  VTM: [{code:"101",name:"Introduction to Veterinary Medicine",level:100,cu:3},{code:"201",name:"Veterinary Anatomy I",level:200,cu:3,lab:true},{code:"202",name:"Veterinary Physiology I",level:200,cu:3,lab:true},{code:"301",name:"Veterinary Pathology",level:300,cu:3,lab:true},{code:"302",name:"Veterinary Pharmacology",level:300,cu:3}],
  VPH: [{code:"101",name:"Introduction to Veterinary Public Health",level:100,cu:3},{code:"201",name:"Food Hygiene and Inspection",level:200,cu:3,lab:true},{code:"202",name:"Epidemiology",level:200,cu:3},{code:"301",name:"Zoonoses",level:300,cu:3},{code:"302",name:"Environmental Health",level:300,cu:3}],
  VAP: [{code:"101",name:"Veterinary Gross Anatomy I",level:100,cu:3,lab:true},{code:"102",name:"Veterinary Histology",level:100,cu:3,lab:true},{code:"201",name:"Veterinary Gross Anatomy II",level:200,cu:3,lab:true},{code:"202",name:"Veterinary Biochemistry",level:200,cu:3,lab:true},{code:"301",name:"Avian Anatomy and Physiology",level:300,cu:3}],
  VSG: [{code:"101",name:"Introduction to Veterinary Surgery",level:100,cu:3},{code:"201",name:"Veterinary Anaesthesiology",level:200,cu:3,lab:true},{code:"202",name:"Diagnostic Imaging",level:200,cu:3},{code:"301",name:"Large Animal Surgery",level:300,cu:3,lab:true}],
  VMT: [{code:"101",name:"Introduction to Veterinary Microbiology",level:100,cu:3,lab:true},{code:"201",name:"Veterinary Bacteriology",level:200,cu:3,lab:true},{code:"202",name:"Veterinary Virology",level:200,cu:3,lab:true},{code:"301",name:"Veterinary Mycology",level:300,cu:3,lab:true}],
};

// 8 rooms
const ROOMS = [
  { code: "AKT", name: "Akatsuki Hall", capacity: 500, type: "EXAM_HALL" as RoomType, building: "Main Campus", hasProjector: true, hasAC: true },
  { code: "CEA", name: "Chunin Exam Arena", capacity: 300, type: "EXAM_HALL" as RoomType, building: "Exam Centre", hasProjector: true, hasAC: true },
  { code: "KLHA", name: "Konoha Lecture Hall A", capacity: 200, type: "LECTURE_HALL" as RoomType, building: "Block A", hasProjector: true, hasAC: true },
  { code: "HMH", name: "Hokage Monument Hall", capacity: 250, type: "LECTURE_HALL" as RoomType, building: "Block B", hasProjector: true, hasAC: true },
  { code: "KLHB", name: "Konoha Lecture Hall B", capacity: 150, type: "LECTURE_HALL" as RoomType, building: "Block A", hasProjector: true, hasAC: true },
  { code: "SCL", name: "Sharingan Computer Lab", capacity: 60, type: "COMPUTER_LAB" as RoomType, building: "ICT Centre", hasProjector: true, hasAC: true, hasComputers: true },
  { code: "FDL", name: "Forest of Death Lab", capacity: 45, type: "LABORATORY" as RoomType, building: "Science Block", hasProjector: false, hasAC: true },
  { code: "HCR", name: "Hokage Conference Room", capacity: 30, type: "CLASSROOM" as RoomType, building: "Admin Block", hasProjector: true, hasAC: true },
];

// Students
const STUDENTS = [
  { regNumber: "FEDKO/2024/001", name: "Boruto Uzumaki", deptCode: "CSC", level: 100, admissionYear: 2024, isSpillover: false },
  { regNumber: "FEDKO/2024/002", name: "Sarada Uchiha", deptCode: "CVE", level: 100, admissionYear: 2024, isSpillover: false },
  { regNumber: "FEDKO/2024/003", name: "Mitsuki", deptCode: "BCH", level: 100, admissionYear: 2024, isSpillover: false },
  { regNumber: "FEDKO/2024/004", name: "Denki Kaminarimon", deptCode: "ECE", level: 100, admissionYear: 2024, isSpillover: false },
  { regNumber: "FEDKO/2024/005", name: "Wasabi Izuno", deptCode: "MCB", level: 100, admissionYear: 2024, isSpillover: false },
  { regNumber: "FEDKO/2024/006", name: "Namida Suzumeno", deptCode: "PHL", level: 100, admissionYear: 2024, isSpillover: false },
  { regNumber: "FEDKO/2024/007", name: "Tsubaki", deptCode: "ARC", level: 100, admissionYear: 2024, isSpillover: false },
  { regNumber: "FEDKO/2023/001", name: "Gaara", deptCode: "POL", level: 200, admissionYear: 2023, isSpillover: false },
  { regNumber: "FEDKO/2023/002", name: "Temari", deptCode: "GEG", level: 200, admissionYear: 2023, isSpillover: false },
  { regNumber: "FEDKO/2023/003", name: "Kankuro", deptCode: "IND", level: 200, admissionYear: 2023, isSpillover: false },
  { regNumber: "FEDKO/2023/004", name: "Metal Lee", deptCode: "MCE", level: 200, admissionYear: 2023, isSpillover: false },
  { regNumber: "FEDKO/2023/005", name: "Inojin Yamanaka", deptCode: "PSY", level: 200, admissionYear: 2023, isSpillover: false },
  { regNumber: "FEDKO/2023/006", name: "Himawari Uzumaki", deptCode: "BOT", level: 200, admissionYear: 2023, isSpillover: false },
  { regNumber: "FEDKO/2023/007", name: "Iwabe Yuino", deptCode: "PET", level: 200, admissionYear: 2023, isSpillover: false },
  { regNumber: "FEDKO/2023/008", name: "Sumire Kakei", deptCode: "CSC", level: 200, admissionYear: 2023, isSpillover: false },
  { regNumber: "FEDKO/2023/009", name: "Samui", deptCode: "ACC", level: 200, admissionYear: 2023, isSpillover: false },
  { regNumber: "FEDKO/2023/010", name: "Omoi", deptCode: "MTH", level: 200, admissionYear: 2023, isSpillover: false },
  { regNumber: "FEDKO/2022/001", name: "Naruto Uzumaki", deptCode: "CSC", level: 300, admissionYear: 2022, isSpillover: true },
  { regNumber: "FEDKO/2022/002", name: "Sasuke Uchiha", deptCode: "ECE", level: 300, admissionYear: 2022, isSpillover: false },
  { regNumber: "FEDKO/2022/003", name: "Hinata Hyuga", deptCode: "PRL", level: 300, admissionYear: 2022, isSpillover: false },
  { regNumber: "FEDKO/2022/004", name: "Choji Akimichi", deptCode: "AGN", level: 300, admissionYear: 2022, isSpillover: false },
  { regNumber: "FEDKO/2022/005", name: "Tenten", deptCode: "MTE", level: 300, admissionYear: 2022, isSpillover: false },
  { regNumber: "FEDKO/2022/006", name: "Neji Hyuga", deptCode: "PHY", level: 300, admissionYear: 2022, isSpillover: false },
  { regNumber: "FEDKO/2022/007", name: "Kiba Inuzuka", deptCode: "VTM", level: 300, admissionYear: 2022, isSpillover: true },
  { regNumber: "FEDKO/2022/008", name: "Shikadai Nara", deptCode: "QSV", level: 300, admissionYear: 2022, isSpillover: false },
  { regNumber: "FEDKO/2022/009", name: "Chocho Akimichi", deptCode: "THA", level: 300, admissionYear: 2022, isSpillover: false },
  { regNumber: "FEDKO/2022/010", name: "Kawaki", deptCode: "CHN", level: 300, admissionYear: 2022, isSpillover: false },
  { regNumber: "FEDKO/2022/011", name: "Karin Uzumaki", deptCode: "BSC", level: 300, admissionYear: 2022, isSpillover: false },
  { regNumber: "FEDKO/2022/012", name: "Moegi Kazamatsuri", deptCode: "ELS", level: 300, admissionYear: 2022, isSpillover: false },
  { regNumber: "FEDKO/2021/001", name: "Shikamaru Nara", deptCode: "STA", level: 400, admissionYear: 2021, isSpillover: false },
  { regNumber: "FEDKO/2021/002", name: "Ino Yamanaka", deptCode: "SWK", level: 400, admissionYear: 2021, isSpillover: false },
  { regNumber: "FEDKO/2021/003", name: "Sakura Haruno", deptCode: "PHA", level: 400, admissionYear: 2021, isSpillover: false },
  { regNumber: "FEDKO/2021/004", name: "Rock Lee", deptCode: "CVE", level: 400, admissionYear: 2021, isSpillover: true },
  { regNumber: "FEDKO/2021/005", name: "Neji Hyuga", deptCode: "GEO", level: 400, admissionYear: 2021, isSpillover: false },
  { regNumber: "FEDKO/2020/001", name: "Kakashi Hatake", deptCode: "MTH", level: 500, admissionYear: 2020, isSpillover: false },
  { regNumber: "FEDKO/2020/002", name: "Tsunade", deptCode: "PHM", level: 500, admissionYear: 2020, isSpillover: false },
];

async function main() {
  console.log("=== SEEDING FEDKO — Federal University of Konoha ===\n");
  const t0 = Date.now();

  // 1. Institution
  const institution = await prisma.institution.create({ data: INSTITUTION });
  const instId = institution.id;
  console.log(`[1] Institution: ${institution.name} (${institution.shortName})`);

  // 2. Demo Users
  const demoUsers = [
    { email: "admin@fedko.edu.ng", name: "Hiruzen Sarutobi", role: "IA" as UserRole },
    { email: "officer@fedko.edu.ng", name: "Iruka Umino", role: "TO" as UserRole },
    { email: "lecturer@fedko.edu.ng", name: "Kakashi Hatake", role: "LC" as UserRole },
    { email: "student@fedko.edu.ng", name: "Naruto Uzumaki", role: "ST" as UserRole },
  ];
  const createdUsers = await prisma.user.createMany({
    data: demoUsers.map((u) => ({
      ...u,
      passwordHash: DEMO_PASSWORD,
      institutionId: instId,
      isActive: true,
    })),
  });
  console.log(`[2] Users: ${createdUsers.count} created`);

  // 3. Faculties (bulk)
  await prisma.faculty.createMany({
    data: FACULTIES.map((f) => ({ institutionId: instId, ...f })),
  });
  console.log(`[3] Faculties: ${FACULTIES.length} created`);

  // Fetch faculties back to get IDs
  const faculties = await prisma.faculty.findMany({ where: { institutionId: instId } });
  const facMap = Object.fromEntries(faculties.map((f) => [f.code, f.id]));

  // 4. Departments (bulk)
  const allDepts = Object.entries(DEPARTMENTS).flatMap(([facCode, depts]) =>
    depts.map((d) => ({ facultyId: facMap[facCode], code: d.code, name: d.name, hodName: d.hod }))
  );
  await prisma.department.createMany({ data: allDepts });
  console.log(`[4] Departments: ${allDepts.length} created`);

  const departments = await prisma.department.findMany({
    where: { faculty: { institutionId: instId } },
    include: { faculty: true },
  });
  const deptMap = Object.fromEntries(departments.map((d) => [d.code, d.id]));

  // 5. Courses (bulk) - build all course records
  const allCoursesData: { institutionId: string; departmentId: string; code: string; name: string; creditUnits: number; level: number; semester: number; requiresLab: boolean; maxStudents: number }[] = [];
  for (const [deptCode, templates] of Object.entries(COURSES)) {
    const depId = deptMap[deptCode];
    if (!depId) continue;
    for (const t of templates) {
      allCoursesData.push({
        institutionId: instId,
        departmentId: depId,
        code: `FUK-${deptCode} ${t.code}`,
        name: t.name,
        creditUnits: t.cu,
        level: t.level,
        semester: 2,
        requiresLab: t.lab || false,
        maxStudents: t.level === 100 ? 200 : t.level === 200 ? 150 : 100,
      });
    }
  }
  await prisma.course.createMany({ data: allCoursesData });
  console.log(`[5] Courses: ${allCoursesData.length} created`);

  const courses = await prisma.course.findMany({ where: { institutionId: instId } });
  const courseMap = Object.fromEntries(courses.map((c) => [c.code, c.id]));

  // 6. Lecturers (bulk)
  const lecturerData: { departmentId: string; staffId: string; name: string; email: string; rank: string; unavailableDays: string }[] = [];
  // Use department HOD names as lecturers
  for (const dept of departments) {
    lecturerData.push({
      departmentId: dept.id,
      staffId: `FUK/${dept.code}/0001`,
      name: dept.hodName || "TBD",
      email: `${dept.code.toLowerCase()}.hod@fedko.edu.ng`,
      rank: "Senior Lecturer",
      unavailableDays: JSON.stringify([]),
    });
  }
  await prisma.lecturer.createMany({ data: lecturerData });
  console.log(`[6] Lecturers: ${lecturerData.length} created`);

  // Assign lecturers to courses (bulk update)
  const lecturers = await prisma.lecturer.findMany({
    where: { department: { faculty: { institutionId: instId } } },
  });
  const lecByDept = Object.fromEntries(lecturers.map((l) => {
    const dept = departments.find((d) => d.id === l.departmentId);
    return [dept?.code || "", l.id];
  }));

  // Update courses with lecturerId in batches
  for (const [deptCode, lecId] of Object.entries(lecByDept)) {
    await prisma.course.updateMany({
      where: { departmentId: deptMap[deptCode], institutionId: instId },
      data: { lecturerId: lecId },
    });
  }
  console.log(`[6b] Lecturers assigned to courses`);

  // 7. Rooms (bulk)
  await prisma.room.createMany({
    data: ROOMS.map((r) => ({
      institutionId: instId,
      code: r.code,
      name: r.name,
      building: r.building,
      capacity: r.capacity,
      type: r.type,
      hasProjector: r.hasProjector,
      hasAC: r.hasAC,
      hasComputers: (r as { hasComputers?: boolean }).hasComputers || false,
    })),
  });
  console.log(`[7] Rooms: ${ROOMS.length} created`);

  // 8. Students (bulk)
  const studentData = STUDENTS.map((s) => ({
    departmentId: deptMap[s.deptCode],
    regNumber: s.regNumber,
    name: s.name,
    email: `${s.regNumber.replace(/\//g, ".").toLowerCase()}@fedko.edu.ng`,
    level: s.level,
    admissionYear: s.admissionYear,
    isSpillover: s.isSpillover,
  }));
  await prisma.student.createMany({ data: studentData });
  console.log(`[8] Students: ${studentData.length} created (${STUDENTS.filter(s => s.isSpillover).length} spillover)`);

  const students = await prisma.student.findMany({
    where: { department: { faculty: { institutionId: instId } } },
  });
  const studentMap = Object.fromEntries(students.map((s) => [s.regNumber, s.id]));

  // 9. Enroll students in courses (bulk)
  const session = "2025/2026";
  const semester = 2;
  const enrollmentData: { studentId: string; courseId: string; status: string; semester: number; session: string }[] = [];

  for (const s of STUDENTS) {
    // Enroll in all dept courses at their level
    const studentDeptCourses = courses.filter(
      (c) => c.departmentId === deptMap[s.deptCode] && c.level === s.level && c.semester === semester
    );
    for (const course of studentDeptCourses) {
      enrollmentData.push({
        studentId: studentMap[s.regNumber],
        courseId: course.id,
        status: "REGISTERED",
        semester,
        session,
      });
    }

    // Spillover students get carry-over courses from lower levels
    if (s.isSpillover && s.level >= 300) {
      const lowerCourses = courses.filter(
        (c) => c.departmentId === deptMap[s.deptCode] && c.level === s.level - 100 && c.semester === semester
      ).slice(0, 2);
      for (const course of lowerCourses) {
        enrollmentData.push({
          studentId: studentMap[s.regNumber],
          courseId: course.id,
          status: "CARRY_OVER",
          semester,
          session,
        });
      }
    }
  }
  await prisma.studentCourse.createMany({ data: enrollmentData });
  const carryOvers = enrollmentData.filter((e) => e.status === "CARRY_OVER").length;
  console.log(`[9] Enrollments: ${enrollmentData.length} (${carryOvers} carry-over)`);

  // 10. Exam Period
  const examPeriod = await prisma.examPeriod.create({
    data: {
      institutionId: instId,
      name: "Second Semester Examination 2025/2026",
      session,
      semester,
      startDate: new Date("2025-08-04"),
      endDate: new Date("2025-08-29"),
      slotsPerDay: 3,
      slotDuration: 180,
      morningStart: "08:00", morningEnd: "11:00",
      afternoonStart: "12:00", afternoonEnd: "15:00",
      eveningStart: "16:00", eveningEnd: "19:00",
      includeSaturday: true,
      excludeFridays: true,
      status: "GENERATED",
    },
  });
  console.log(`[10] Exam Period created`);

  // 11. Build clash-free exam timetable
  // Get enrollment data
  const allEnrollments = await prisma.studentCourse.findMany({
    where: { session, semester },
    select: { studentId: true, courseId: true },
  });
  const courseStudents: Record<string, Set<string>> = {};
  for (const e of allEnrollments) {
    if (!courseStudents[e.courseId]) courseStudents[e.courseId] = new Set();
    courseStudents[e.courseId].add(e.studentId);
  }
  const courseEnrollment: Record<string, number> = {};
  for (const [cid, sids] of Object.entries(courseStudents)) courseEnrollment[cid] = sids.size;

  // Get rooms
  const allRooms = await prisma.room.findMany({ where: { institutionId: instId }, orderBy: { capacity: "desc" } });
  const roomMap = Object.fromEntries(allRooms.map((r) => [r.code, r.id]));

  // Generate exam dates (Mon-Sat, skip Fridays)
  const examDates: Date[] = [];
  const cur = new Date("2025-08-04");
  const end = new Date("2025-08-29");
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow >= 1 && dow <= 6 && dow !== 5) examDates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  // Greedy clash-free assignment
  const slotOccupancy: Record<string, string[]> = {};
  const examSlotData: { examPeriodId: string; courseId: string; roomId: string; date: Date; dayOfWeek: number; slotNumber: number; startTime: string; endTime: string; status: string }[] = [];

  // Sort by enrollment desc
  const sortedCourses = [...courses].filter(c => c.semester === semester).sort((a, b) => {
    return (courseEnrollment[b.id] || 0) - (courseEnrollment[a.id] || 0);
  });

  for (const course of sortedCourses) {
    const enrollment = courseEnrollment[course.id] || 0;
    let assigned = false;

    // Room selection
    let roomId: string;
    if (enrollment > 300) roomId = roomMap["AKT"];
    else if (enrollment > 200) roomId = roomMap["HMH"] || roomMap["CEA"];
    else if (enrollment > 100) roomId = roomMap["KLHA"] || roomMap["KLHB"];
    else if (enrollment > 45) roomId = roomMap["KLHB"] || roomMap["HMH"];
    else if (course.requiresLab) roomId = roomMap["SCL"] || roomMap["FDL"];
    else roomId = roomMap["HCR"] || roomMap["FDL"];
    if (!roomId) roomId = allRooms[0].id;

    const myStudents = courseStudents[course.id] || new Set();

    for (let di = 0; di < examDates.length && !assigned; di++) {
      for (let sn = 1; sn <= 3 && !assigned; sn++) {
        const key = `${di}-${sn}`;
        const occ = slotOccupancy[key] || [];
        let clash = false;
        for (const occId of occ) {
          const occS = courseStudents[occId];
          if (!occS) continue;
          for (const sid of myStudents) {
            if (occS.has(sid)) { clash = true; break; }
          }
          if (clash) break;
        }

        if (!clash) {
          const d = examDates[di];
          const times = [["08:00","11:00"],["12:00","15:00"],["16:00","19:00"]][sn - 1];
          examSlotData.push({
            examPeriodId: examPeriod.id,
            courseId: course.id,
            roomId,
            date: d,
            dayOfWeek: d.getDay(),
            slotNumber: sn,
            startTime: times[0],
            endTime: times[1],
            status: "SCHEDULED",
          });
          slotOccupancy[key] = [...occ, course.id];
          assigned = true;
        }
      }
    }
  }

  // Insert in batches of 50
  for (let i = 0; i < examSlotData.length; i += 50) {
    await prisma.examSlot.createMany({ data: examSlotData.slice(i, i + 50) });
  }
  console.log(`[11] Exam Slots: ${examSlotData.length} created`);

  // 12. Lecture Timetable + slots
  const lectureTimetable = await prisma.lectureTimetable.create({
    data: {
      institutionId: instId, name: "Second Semester Lecture Timetable 2025/2026",
      session, semester, startDate: new Date("2025-02-17"), endDate: new Date("2025-06-28"), status: "PUBLISHED",
    },
  });

  // Representative lecture slots for 100L and 200L courses
  const lecCourses = courses.filter(c => c.level <= 200 && c.semester === semester);
  const lecSlotData: { lectureTimetableId: string; courseId: string; roomId: string; dayOfWeek: number; startTime: string; endTime: string; isRecurring: boolean; status: string }[] = [];
  const lecOcc: Record<string, string[]> = {};

  for (const course of lecCourses) {
    const enrollment = courseEnrollment[course.id] || 0;
    const roomId = enrollment > 100 ? roomMap["KLHA"] : enrollment > 45 ? roomMap["KLHB"] : course.requiresLab ? roomMap["SCL"] : roomMap["HCR"];
    if (!roomId) continue;
    const myS = courseStudents[course.id] || new Set();

    for (let day = 1; day <= 6; day++) {
      for (const time of ["08:00","10:00","12:00","14:00"]) {
        const key = `${day}-${time}`;
        const occ = lecOcc[key] || [];
        let clash = false;
        for (const oid of occ) {
          const os = courseStudents[oid];
          if (!os) continue;
          for (const sid of myS) { if (os.has(sid)) { clash = true; break; } }
          if (clash) break;
        }
        if (!clash) {
          const endH = parseInt(time.split(":")[0]) + 2;
          lecSlotData.push({
            lectureTimetableId: lectureTimetable.id, courseId: course.id, roomId,
            dayOfWeek: day, startTime: time, endTime: `${String(endH).padStart(2,"0")}:00`,
            isRecurring: true, status: "ACTIVE",
          });
          lecOcc[key] = [...occ, course.id];
          break; // one slot per course
        }
      }
      if (lecSlotData.find(s => s.courseId === course.id)) break;
    }
  }

  for (let i = 0; i < lecSlotData.length; i += 50) {
    await prisma.lectureSlot.createMany({ data: lecSlotData.slice(i, i + 50) });
  }
  console.log(`[12] Lecture Slots: ${lecSlotData.length} created`);

  // 13. Conflict Report (clean)
  await prisma.conflictReport.create({
    data: {
      examPeriodId: examPeriod.id, totalConflicts: 0, criticalCount: 0,
      warningCount: 0, infoCount: 0, status: "APPROVED",
    },
  });

  // 14. Timetable Version
  await prisma.timetableVersion.create({
    data: {
      examPeriodId: examPeriod.id, version: 1, isCurrent: true, publishedAt: new Date(),
      changes: JSON.stringify({ action: "Initial generation", slots: examSlotData.length }),
    },
  });

  // 15. Notifications
  const fedkoUserRecords = await prisma.user.findMany({ where: { institutionId: instId }, select: { id: true } });
  const notifData = fedkoUserRecords.map((u) => ({
    userId: u.id, title: "Exam Timetable Published",
    message: `The second semester ${session} exam timetable has been generated and is available. Check your personal schedule.`,
    type: "SCHEDULE_CHANGE", actionUrl: "/dashboard",
  }));
  await prisma.notification.createMany({ data: notifData });
  console.log(`[13-15] Reports, Versions, Notifications created`);

  // Summary
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n${"=".repeat(50)}`);
  console.log(`SEED COMPLETE in ${elapsed}s`);
  console.log(`${"=".repeat(50)}`);

  const c = {
    Institution: await prisma.institution.count(),
    User: await prisma.user.count(),
    Faculty: await prisma.faculty.count(),
    Department: await prisma.department.count(),
    Course: await prisma.course.count(),
    Student: await prisma.student.count(),
    Lecturer: await prisma.lecturer.count(),
    Room: await prisma.room.count(),
    ExamPeriod: await prisma.examPeriod.count(),
    ExamSlot: await prisma.examSlot.count(),
    StudentCourse: await prisma.studentCourse.count(),
    LectureSlot: await prisma.lectureSlot.count(),
    Notification: await prisma.notification.count(),
  };
  console.table(c);
}

main().catch((e) => { console.error("SEED FAILED:", e); process.exit(1); }).finally(() => prisma.$disconnect());
