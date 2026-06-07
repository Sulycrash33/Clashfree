import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// POST /api/admin/seed-fedko
// Header: x-seed-secret: <SEED_SECRET env var>
// This route: purges existing FEDKO, then seeds fresh data
// DELETE this file after seeding is confirmed.

const INSTITUTION_DATA = {
  name: "Federal University of Konoha",
  shortName: "FEDKO",
  type: "FEDERAL_UNI" as const,
  city: "Konoha",
  state: "Niger State",
  country: "Nigeria",
  currentSession: "2025/2026",
  currentSemester: 2,
  website: "https://fedko.edu.ng",
  emailDomain: "fedko.edu.ng",
}

const FACULTIES = [
  { code:"FAD", name:"Faculty of Administration",                deanName:"Prof. Tsunade" },
  { code:"FAG", name:"Faculty of Agriculture",                   deanName:"Prof. Yamato" },
  { code:"FAL", name:"Faculty of Arts",                          deanName:"Prof. Kurenai Yuhi" },
  { code:"FEN", name:"Faculty of Engineering",                   deanName:"Prof. Minato Namikaze" },
  { code:"FED", name:"Faculty of Environmental Design",          deanName:"Prof. Orochimaru" },
  { code:"FLA", name:"Faculty of Law",                           deanName:"Prof. Danzo Shimura" },
  { code:"FPS", name:"Faculty of Physical and Applied Sciences", deanName:"Prof. Hiruzen Sarutobi" },
  { code:"FSS", name:"Faculty of Social Sciences",               deanName:"Prof. Itachi Uchiha" },
  { code:"FVM", name:"Faculty of Veterinary Medicine",           deanName:"Prof. Kiba Inuzuka" },
  { code:"FPH", name:"Faculty of Pharmacy",                      deanName:"Prof. Sakura Haruno" },
]

const DEPARTMENTS: Record<string, {code:string;name:string;hod:string}[]> = {
  FAD:[
    {code:"ACC",name:"Accounting",                                   hod:"Dr. Shikamaru Nara"},
    {code:"BUS",name:"Business Administration",                      hod:"Dr. Ino Yamanaka"},
    {code:"LGS",name:"Local Government and Development Studies",     hod:"Dr. Choji Akimichi"},
    {code:"PAD",name:"Public Administration",                        hod:"Dr. Temari"},
  ],
  FAG:[
    {code:"AEC",name:"Agricultural Economics and Rural Sociology",   hod:"Dr. Sai"},
    {code:"AGN",name:"Agronomy",                                     hod:"Dr. Konohamaru Sarutobi"},
    {code:"ANS",name:"Animal Science",                               hod:"Dr. Kiba Inuzuka"},
    {code:"CRP",name:"Crop Protection",                              hod:"Dr. Shino Aburame"},
    {code:"PLS",name:"Plant Science",                                hod:"Dr. Ino Yamanaka"},
    {code:"SLS",name:"Soil Science",                                 hod:"Dr. Iruka Umino"},
    {code:"AER",name:"Agricultural Extension and Rural Development", hod:"Dr. Asuma Sarutobi"},
  ],
  FAL:[
    {code:"ALC",name:"African Languages and Cultures",               hod:"Dr. Killer B"},
    {code:"ARA",name:"Arabic",                                       hod:"Dr. Gaara"},
    {code:"AHS",name:"Archaeology and Heritage Studies",             hod:"Dr. Hiruzen Sarutobi"},
    {code:"ELS",name:"English and Literary Studies",                 hod:"Dr. Kakashi Hatake"},
    {code:"FRE",name:"French",                                       hod:"Dr. Yugao Uzuki"},
    {code:"HIS",name:"History",                                      hod:"Dr. Jiraiya"},
    {code:"PHL",name:"Philosophy",                                   hod:"Dr. Nagato"},
    {code:"THA",name:"Theatre and Performing Arts",                  hod:"Dr. Might Guy"},
  ],
  FEN:[
    {code:"ABE",name:"Agricultural and Bioresources Engineering",    hod:"Dr. Yamato"},
    {code:"AUT",name:"Automotive Engineering",                       hod:"Dr. Darui"},
    {code:"CHN",name:"Chemical Engineering",                         hod:"Dr. Kabuto Yakushi"},
    {code:"CVE",name:"Civil Engineering",                            hod:"Dr. Hashirama Senju"},
    {code:"CME",name:"Communications Engineering",                   hod:"Dr. Ibiki Morino"},
    {code:"ECE",name:"Electrical and Computer Engineering",          hod:"Dr. Tobirama Senju"},
    {code:"GLT",name:"Glass Technology",                             hod:"Dr. Baki"},
    {code:"MCE",name:"Mechanical Engineering",                       hod:"Dr. Rock Lee"},
    {code:"MTE",name:"Mechatronics Engineering",                     hod:"Dr. Neji Hyuga"},
    {code:"MET",name:"Metallurgical and Materials Engineering",      hod:"Dr. Tenten"},
    {code:"PET",name:"Petroleum Engineering",                        hod:"Dr. Rasa"},
    {code:"TST",name:"Textile Science and Technology",               hod:"Dr. Anko Mitarashi"},
    {code:"WRE",name:"Water Resources and Environmental Engineering",hod:"Dr. Suigetsu Hozuki"},
  ],
  FED:[
    {code:"ARC",name:"Architecture",         hod:"Dr. Sasori"},
    {code:"BLD",name:"Building",             hod:"Dr. Deidara"},
    {code:"FNA",name:"Fine Arts",            hod:"Dr. Sai"},
    {code:"GEM",name:"Geomatics",            hod:"Dr. Konan"},
    {code:"IND",name:"Industrial Design",    hod:"Dr. Hidan"},
    {code:"QSV",name:"Quantity Surveying",   hod:"Dr. Kakuzu"},
    {code:"URP",name:"Urban and Regional Planning", hod:"Dr. Yahiko"},
  ],
  FLA:[
    {code:"ILW",name:"Islamic Law",      hod:"Dr. Gaara"},
    {code:"PBL",name:"Public Law",       hod:"Dr. Tsunade"},
    {code:"CML",name:"Commercial Law",   hod:"Dr. Shikamaru Nara"},
    {code:"PRL",name:"Private Law",      hod:"Dr. Hinata Hyuga"},
  ],
  FPS:[
    {code:"BCH",name:"Biochemistry",          hod:"Dr. Kabuto Yakushi"},
    {code:"BSC",name:"Biological Sciences",   hod:"Dr. Shino Aburame"},
    {code:"BOT",name:"Botany",                hod:"Dr. Ino Yamanaka"},
    {code:"MCB",name:"Microbiology",          hod:"Dr. Orochimaru"},
    {code:"ZOO",name:"Zoology",               hod:"Dr. Kiba Inuzuka"},
    {code:"CHM",name:"Chemistry",             hod:"Dr. Sasori"},
    {code:"CSC",name:"Computer Science",      hod:"Dr. Shikamaru Nara"},
    {code:"GEG",name:"Geography",             hod:"Dr. Konan"},
    {code:"GEO",name:"Geology",               hod:"Dr. Onoki"},
    {code:"MTH",name:"Mathematics",           hod:"Dr. Itachi Uchiha"},
    {code:"PHY",name:"Physics",               hod:"Dr. Minato Namikaze"},
    {code:"STA",name:"Statistics",            hod:"Dr. Temari"},
  ],
  FSS:[
    {code:"MAC",name:"Mass Communication",                          hod:"Dr. Jiraiya"},
    {code:"POL",name:"Political Science and International Studies", hod:"Dr. Madara Uchiha"},
    {code:"SOC",name:"Sociology",                                   hod:"Dr. Nagato"},
  ],
  FVM:[
    {code:"VTM",name:"Veterinary Medicine",                     hod:"Dr. Kiba Inuzuka"},
    {code:"VPH",name:"Veterinary Public Health",                hod:"Dr. Shizune"},
    {code:"VAP",name:"Veterinary Anatomy and Physiology",       hod:"Dr. Sakura Haruno"},
    {code:"VSG",name:"Veterinary Surgery",                      hod:"Dr. Tsunade"},
    {code:"VMT",name:"Veterinary Microbiology and Parasitology",hod:"Dr. Kabuto Yakushi"},
  ],
  FPH:[
    {code:"PHA",name:"Pharmacy",                                     hod:"Dr. Sakura Haruno"},
    {code:"PHM",name:"Pharmacology and Toxicology",                  hod:"Dr. Tsunade"},
    {code:"PHC",name:"Pharmaceutical and Medicinal Chemistry",       hod:"Dr. Kabuto Yakushi"},
    {code:"PHT",name:"Pharmacognosy and Herbal Medicine",            hod:"Dr. Shizune"},
  ],
}

// Courses: 4 per dept (100L + 200L only — enough for demo, keeps route under Vercel 250KB limit)
const COURSES: Record<string,{code:string;name:string;level:number;cu:number;lab?:boolean}[]> = {
  ACC:[{code:"101",name:"Introduction to Financial Accounting",level:100,cu:3},{code:"102",name:"Principles of Cost Accounting",level:100,cu:3},{code:"201",name:"Financial Accounting I",level:200,cu:3},{code:"202",name:"Cost and Management Accounting",level:200,cu:3},{code:"301",name:"Advanced Financial Accounting",level:300,cu:3},{code:"302",name:"Public Sector Accounting and Finance",level:300,cu:3},{code:"401",name:"Auditing and Assurance",level:400,cu:3},{code:"402",name:"Taxation and Fiscal Policy",level:400,cu:3}],
  BUS:[{code:"101",name:"Introduction to Business Administration",level:100,cu:3},{code:"102",name:"Principles of Management",level:100,cu:2},{code:"201",name:"Business Organisation and Environment",level:200,cu:3},{code:"202",name:"Business Statistics",level:200,cu:3},{code:"301",name:"Operations Management",level:300,cu:3},{code:"302",name:"Entrepreneurship and Small Business Management",level:300,cu:3},{code:"401",name:"Strategic Management",level:400,cu:3},{code:"402",name:"Research Methods in Business",level:400,cu:3}],
  LGS:[{code:"101",name:"Introduction to Local Government Studies",level:100,cu:2},{code:"102",name:"Nigerian Government and Politics",level:100,cu:3},{code:"201",name:"Community Development",level:200,cu:3},{code:"202",name:"Rural Development Administration",level:200,cu:3},{code:"301",name:"Local Government Finance",level:300,cu:3},{code:"302",name:"Inter-Governmental Relations",level:300,cu:2},{code:"401",name:"Local Government and Poverty Alleviation",level:400,cu:3},{code:"402",name:"Decentralisation and Governance",level:400,cu:3}],
  PAD:[{code:"101",name:"Introduction to Public Administration",level:100,cu:3},{code:"102",name:"History of Public Administration in Nigeria",level:100,cu:2},{code:"201",name:"Public Policy Analysis",level:200,cu:3},{code:"202",name:"Administrative Theory",level:200,cu:3},{code:"301",name:"Development Administration",level:300,cu:3},{code:"302",name:"Personnel Administration",level:300,cu:3},{code:"401",name:"Public Enterprise Management",level:400,cu:3},{code:"402",name:"Research Methods in Public Administration",level:400,cu:3}],
  AEC:[{code:"101",name:"Introduction to Agricultural Economics",level:100,cu:3},{code:"102",name:"Principles of Agricultural Production",level:100,cu:2},{code:"201",name:"Farm Management and Production Economics",level:200,cu:3},{code:"202",name:"Agricultural Marketing and Prices",level:200,cu:3},{code:"301",name:"Project Appraisal in Agriculture",level:300,cu:3},{code:"302",name:"Agricultural Finance and Credit",level:300,cu:3},{code:"401",name:"Agricultural Policy and Development",level:400,cu:3},{code:"402",name:"Rural Sociology and Development",level:400,cu:3}],
  AGN:[{code:"101",name:"Introduction to Agronomy",level:100,cu:3},{code:"102",name:"Principles of Crop Production",level:100,cu:3},{code:"201",name:"Crop Physiology and Ecology",level:200,cu:3},{code:"202",name:"Seed Technology",level:200,cu:3},{code:"301",name:"Cereal and Legume Production",level:300,cu:3,lab:true},{code:"302",name:"Forage and Pasture Management",level:300,cu:3},{code:"401",name:"Agroforestry",level:400,cu:3},{code:"402",name:"Precision Agriculture",level:400,cu:3}],
  ANS:[{code:"101",name:"Introduction to Animal Science",level:100,cu:3},{code:"102",name:"Animal Anatomy and Physiology",level:100,cu:3},{code:"201",name:"Animal Nutrition and Feeding",level:200,cu:3},{code:"202",name:"Animal Breeding and Genetics",level:200,cu:3},{code:"301",name:"Livestock Production Management",level:300,cu:3,lab:true},{code:"302",name:"Poultry Production",level:300,cu:3},{code:"401",name:"Animal Products Technology",level:400,cu:3,lab:true},{code:"402",name:"Aquaculture and Fisheries Management",level:400,cu:3}],
  CRP:[{code:"101",name:"Introduction to Crop Protection",level:100,cu:3},{code:"102",name:"General Entomology",level:100,cu:3},{code:"201",name:"Principles of Plant Pathology",level:200,cu:3,lab:true},{code:"202",name:"Agricultural Entomology",level:200,cu:3,lab:true},{code:"301",name:"Weed Science and Control",level:300,cu:3},{code:"302",name:"Pesticide Chemistry and Toxicology",level:300,cu:3,lab:true},{code:"401",name:"Integrated Pest Management",level:400,cu:3},{code:"402",name:"Post-Harvest Pathology",level:400,cu:3}],
  PLS:[{code:"101",name:"Introduction to Plant Biology",level:100,cu:3},{code:"102",name:"Plant Morphology and Anatomy",level:100,cu:3},{code:"201",name:"Plant Physiology I",level:200,cu:3},{code:"202",name:"Plant Genetics",level:200,cu:3},{code:"301",name:"Plant Tissue Culture",level:300,cu:3,lab:true},{code:"302",name:"Plant Biotechnology",level:300,cu:3},{code:"401",name:"Crop Improvement Methods",level:400,cu:3},{code:"402",name:"Ethnobotany",level:400,cu:3}],
  SLS:[{code:"101",name:"Introduction to Soil Science",level:100,cu:3},{code:"102",name:"Basic Soil Science",level:100,cu:3},{code:"201",name:"Soil Physics",level:200,cu:3,lab:true},{code:"202",name:"Soil Chemistry and Fertility",level:200,cu:3,lab:true},{code:"301",name:"Soil Conservation and Management",level:300,cu:3},{code:"302",name:"Land Use Planning",level:300,cu:2},{code:"401",name:"Soil Microbiology",level:400,cu:3,lab:true},{code:"402",name:"Soil and Water Management",level:400,cu:3}],
  AER:[{code:"101",name:"Introduction to Agricultural Extension",level:100,cu:3},{code:"102",name:"Rural Sociology",level:100,cu:2},{code:"201",name:"Extension Methods and Communication",level:200,cu:3},{code:"202",name:"Agricultural Development Programmes",level:200,cu:3},{code:"301",name:"Extension Administration and Supervision",level:300,cu:3},{code:"302",name:"Adoption and Diffusion of Innovations",level:300,cu:3},{code:"401",name:"Training and Visit Extension System",level:400,cu:3},{code:"402",name:"Gender and Agricultural Development",level:400,cu:3}],
  ALC:[{code:"101",name:"Introduction to African Languages",level:100,cu:3},{code:"102",name:"Hausa Language I",level:100,cu:3},{code:"201",name:"Igbo Language I",level:200,cu:3},{code:"202",name:"Yoruba Language I",level:200,cu:3},{code:"301",name:"Language and National Development",level:300,cu:3},{code:"302",name:"Oral Literature in African Languages",level:300,cu:3},{code:"401",name:"Language Policy in Nigeria",level:400,cu:3},{code:"402",name:"Applied Linguistics in African Context",level:400,cu:3}],
  ARA:[{code:"101",name:"Introduction to Arabic Language",level:100,cu:3},{code:"102",name:"Arabic Grammar I",level:100,cu:3},{code:"201",name:"Arabic Composition",level:200,cu:3},{code:"202",name:"Arabic Literature",level:200,cu:3},{code:"301",name:"Advanced Arabic Syntax",level:300,cu:3},{code:"302",name:"Arabic Rhetoric and Prosody",level:300,cu:3},{code:"401",name:"Translation: Arabic and English",level:400,cu:3},{code:"402",name:"Modern Arabic Literature",level:400,cu:3}],
  AHS:[{code:"101",name:"Introduction to Archaeology",level:100,cu:3},{code:"102",name:"Heritage Studies and Museum Practice",level:100,cu:3},{code:"201",name:"Nigerian Prehistory",level:200,cu:3},{code:"202",name:"Archaeological Methods and Fieldwork",level:200,cu:3,lab:true},{code:"301",name:"African Iron Age Archaeology",level:300,cu:3},{code:"302",name:"Heritage Management and Policy",level:300,cu:3},{code:"401",name:"Conservation of Cultural Heritage",level:400,cu:3},{code:"402",name:"Digital Archaeology",level:400,cu:3}],
  ELS:[{code:"101",name:"Introduction to English Language",level:100,cu:3},{code:"102",name:"Introduction to Literary Studies",level:100,cu:3},{code:"201",name:"English Syntax and Morphology",level:200,cu:3},{code:"202",name:"African Literature in English",level:200,cu:3},{code:"301",name:"Introduction to Sociolinguistics",level:300,cu:3},{code:"302",name:"Nigerian Literature in English",level:300,cu:3},{code:"401",name:"Discourse Analysis",level:400,cu:3},{code:"402",name:"Research Methods in English Studies",level:400,cu:3}],
  FRE:[{code:"101",name:"Introduction to French Language",level:100,cu:3},{code:"102",name:"French Grammar I",level:100,cu:3},{code:"201",name:"French Composition",level:200,cu:3},{code:"202",name:"Introduction to French Literature",level:200,cu:3},{code:"301",name:"French Phonetics and Phonology",level:300,cu:2},{code:"302",name:"Francophone African Literature",level:300,cu:3},{code:"401",name:"Translation: French and English",level:400,cu:3},{code:"402",name:"French Civilisation",level:400,cu:3}],
  HIS:[{code:"101",name:"Introduction to History",level:100,cu:3},{code:"102",name:"History of Nigeria to 1900",level:100,cu:3},{code:"201",name:"Nigeria in the 20th Century",level:200,cu:3},{code:"202",name:"European History since 1789",level:200,cu:3},{code:"301",name:"History of International Relations",level:300,cu:3},{code:"302",name:"African History since Independence",level:300,cu:3},{code:"401",name:"Nigerian Foreign Policy",level:400,cu:3},{code:"402",name:"Historiography and Historical Methods",level:400,cu:3}],
  PHL:[{code:"101",name:"Introduction to Philosophy",level:100,cu:3},{code:"102",name:"Logic and Critical Thinking",level:100,cu:3},{code:"201",name:"History of Philosophy",level:200,cu:3},{code:"202",name:"Ethics and Social Philosophy",level:200,cu:3},{code:"301",name:"African Philosophy",level:300,cu:3},{code:"302",name:"Philosophy of Religion",level:300,cu:3},{code:"401",name:"Political Philosophy",level:400,cu:3},{code:"402",name:"Epistemology and Metaphysics",level:400,cu:3}],
  THA:[{code:"101",name:"Introduction to Theatre Arts",level:100,cu:3},{code:"102",name:"Basic Acting Techniques",level:100,cu:2},{code:"201",name:"Stagecraft and Design",level:200,cu:3},{code:"202",name:"Play Production",level:200,cu:3},{code:"301",name:"African Drama and Theatre",level:300,cu:3},{code:"302",name:"Dramatic Literature",level:300,cu:3},{code:"401",name:"Theatre Management and Administration",level:400,cu:3},{code:"402",name:"Film and Video Production",level:400,cu:3}],
  ABE:[{code:"101",name:"Introduction to Agricultural Engineering",level:100,cu:3},{code:"102",name:"Engineering Drawing for Agriculture",level:100,cu:2},{code:"201",name:"Farm Power and Machinery",level:200,cu:3},{code:"202",name:"Irrigation and Drainage Engineering",level:200,cu:3},{code:"301",name:"Post-Harvest Engineering",level:300,cu:3,lab:true},{code:"302",name:"Soil and Water Conservation Engineering",level:300,cu:3},{code:"401",name:"Renewable Energy for Agriculture",level:400,cu:3},{code:"402",name:"Bioresource Engineering",level:400,cu:3,lab:true}],
  AUT:[{code:"101",name:"Introduction to Automotive Engineering",level:100,cu:3},{code:"102",name:"Automotive Electrical Systems",level:100,cu:3,lab:true},{code:"201",name:"Internal Combustion Engines",level:200,cu:3},{code:"202",name:"Vehicle Dynamics",level:200,cu:3},{code:"301",name:"Automotive Design and Manufacturing",level:300,cu:3,lab:true},{code:"302",name:"Automotive Electronics",level:300,cu:3},{code:"401",name:"Electric and Hybrid Vehicles",level:400,cu:3},{code:"402",name:"Vehicle Safety Engineering",level:400,cu:3}],
  CHN:[{code:"101",name:"Introduction to Chemical Engineering",level:100,cu:3},{code:"102",name:"Material and Energy Balances",level:100,cu:3},{code:"201",name:"Chemical Engineering Thermodynamics",level:200,cu:3},{code:"202",name:"Fluid Flow Operations",level:200,cu:3,lab:true},{code:"301",name:"Chemical Reaction Engineering I",level:300,cu:3},{code:"302",name:"Heat and Mass Transfer",level:300,cu:3,lab:true},{code:"401",name:"Process Control and Dynamics",level:400,cu:3},{code:"402",name:"Plant Design and Economics",level:400,cu:3}],
  CVE:[{code:"101",name:"Introduction to Civil Engineering",level:100,cu:3},{code:"102",name:"Engineering Drawing I",level:100,cu:2},{code:"201",name:"Strength of Materials",level:200,cu:3},{code:"202",name:"Fluid Mechanics I",level:200,cu:3,lab:true},{code:"301",name:"Structural Analysis I",level:300,cu:3},{code:"302",name:"Geotechnical Engineering",level:300,cu:3,lab:true},{code:"401",name:"Highway and Transportation Engineering",level:400,cu:3},{code:"402",name:"Water Supply and Sanitary Engineering",level:400,cu:3}],
  CME:[{code:"101",name:"Introduction to Communications Engineering",level:100,cu:3},{code:"102",name:"Digital Logic and Circuit Theory",level:100,cu:3,lab:true},{code:"201",name:"Signals and Systems",level:200,cu:3},{code:"202",name:"Electromagnetic Wave Theory",level:200,cu:3},{code:"301",name:"Digital Communications",level:300,cu:3},{code:"302",name:"Mobile and Wireless Networks",level:300,cu:3},{code:"401",name:"Satellite and Optical Communications",level:400,cu:3},{code:"402",name:"Network Security and Cryptography",level:400,cu:3}],
  ECE:[{code:"101",name:"Introduction to Electrical Engineering",level:100,cu:3},{code:"102",name:"Circuit Theory I",level:100,cu:3,lab:true},{code:"201",name:"Electronics I",level:200,cu:3,lab:true},{code:"202",name:"Electromagnetic Fields and Waves",level:200,cu:3},{code:"301",name:"Digital Systems and Microprocessors",level:300,cu:3},{code:"302",name:"Communication Principles",level:300,cu:3},{code:"401",name:"Power Systems Engineering",level:400,cu:3},{code:"402",name:"Control Systems Engineering",level:400,cu:3}],
  GLT:[{code:"101",name:"Introduction to Glass Technology",level:100,cu:3},{code:"102",name:"Raw Materials for Glass Manufacture",level:100,cu:3},{code:"201",name:"Glass Melting and Forming Processes",level:200,cu:3,lab:true},{code:"202",name:"Glass Properties and Testing",level:200,cu:3,lab:true},{code:"301",name:"Special and Technical Glasses",level:300,cu:3},{code:"302",name:"Glass Surface Treatments",level:300,cu:3,lab:true},{code:"401",name:"Glass Industry Management",level:400,cu:3},{code:"402",name:"Ceramic and Refractory Materials",level:400,cu:3}],
  MCE:[{code:"101",name:"Introduction to Mechanical Engineering",level:100,cu:3},{code:"102",name:"Engineering Thermodynamics I",level:100,cu:3},{code:"201",name:"Mechanics of Machines I",level:200,cu:3},{code:"202",name:"Manufacturing Processes I",level:200,cu:3,lab:true},{code:"301",name:"Machine Design I",level:300,cu:3},{code:"302",name:"Fluid Mechanics and Machinery",level:300,cu:3,lab:true},{code:"401",name:"Industrial Engineering and Management",level:400,cu:3},{code:"402",name:"Renewable Energy Engineering",level:400,cu:3}],
  MTE:[{code:"101",name:"Introduction to Mechatronics Engineering",level:100,cu:3},{code:"102",name:"Digital Electronics",level:100,cu:3,lab:true},{code:"201",name:"Control Systems I",level:200,cu:3},{code:"202",name:"Microprocessors and Microcontrollers",level:200,cu:3,lab:true},{code:"301",name:"Robotics and Automation",level:300,cu:3,lab:true},{code:"302",name:"Embedded Systems Design",level:300,cu:3,lab:true},{code:"401",name:"Artificial Intelligence in Mechatronics",level:400,cu:3},{code:"402",name:"Industrial Automation Systems",level:400,cu:3}],
  MET:[{code:"101",name:"Introduction to Materials Engineering",level:100,cu:3},{code:"102",name:"Engineering Materials I",level:100,cu:3},{code:"201",name:"Physical Metallurgy I",level:200,cu:3,lab:true},{code:"202",name:"Mechanical Properties of Materials",level:200,cu:3,lab:true},{code:"301",name:"Extractive Metallurgy",level:300,cu:3},{code:"302",name:"Failure Analysis and Corrosion Control",level:300,cu:3},{code:"401",name:"Nanomaterials and Advanced Materials",level:400,cu:3},{code:"402",name:"Welding and Joining Technology",level:400,cu:3,lab:true}],
  PET:[{code:"101",name:"Introduction to Petroleum Engineering",level:100,cu:3},{code:"102",name:"Petroleum Geology",level:100,cu:3},{code:"201",name:"Reservoir Engineering I",level:200,cu:3},{code:"202",name:"Drilling Engineering I",level:200,cu:3},{code:"301",name:"Petroleum Production Engineering",level:300,cu:3},{code:"302",name:"Well Logging and Formation Evaluation",level:300,cu:3},{code:"401",name:"Enhanced Oil Recovery",level:400,cu:3},{code:"402",name:"Petroleum Economics and Management",level:400,cu:3}],
  TST:[{code:"101",name:"Introduction to Textile Science",level:100,cu:3},{code:"102",name:"Fibre Science I",level:100,cu:3},{code:"201",name:"Textile Yarn Manufacturing",level:200,cu:3,lab:true},{code:"202",name:"Fabric Formation Processes",level:200,cu:3,lab:true},{code:"301",name:"Textile Dyeing and Finishing",level:300,cu:3,lab:true},{code:"302",name:"Textile Testing and Quality Control",level:300,cu:3,lab:true},{code:"401",name:"Technical Textiles",level:400,cu:3},{code:"402",name:"Textile Industry Management",level:400,cu:3}],
  WRE:[{code:"101",name:"Introduction to Water Resources Engineering",level:100,cu:3},{code:"102",name:"Environmental Science",level:100,cu:3},{code:"201",name:"Hydrology and Water Resources",level:200,cu:3},{code:"202",name:"Environmental Impact Assessment",level:200,cu:3},{code:"301",name:"Dam Engineering",level:300,cu:3},{code:"302",name:"Groundwater Engineering",level:300,cu:3,lab:true},{code:"401",name:"Water Supply and Treatment Engineering",level:400,cu:3},{code:"402",name:"Solid Waste and Pollution Control",level:400,cu:3}],
  ARC:[{code:"101",name:"Introduction to Architecture",level:100,cu:3},{code:"102",name:"Architectural Drawing I",level:100,cu:3},{code:"201",name:"Architectural Design I",level:200,cu:4},{code:"202",name:"Building Construction I",level:200,cu:3},{code:"301",name:"Architectural Design II",level:300,cu:4},{code:"302",name:"Environmental Control in Buildings",level:300,cu:3},{code:"401",name:"Professional Practice and Management",level:400,cu:3},{code:"402",name:"Urban Design and Planning",level:400,cu:3}],
  BLD:[{code:"101",name:"Introduction to Building Technology",level:100,cu:3},{code:"102",name:"Building Materials I",level:100,cu:3},{code:"201",name:"Building Construction I",level:200,cu:3},{code:"202",name:"Building Services I",level:200,cu:3},{code:"301",name:"Structural Elements in Building",level:300,cu:3},{code:"302",name:"Building Economics",level:300,cu:3},{code:"401",name:"Construction Project Management",level:400,cu:3},{code:"402",name:"Building Maintenance and Management",level:400,cu:3}],
  FNA:[{code:"101",name:"Introduction to Fine Arts",level:100,cu:3},{code:"102",name:"Drawing and Composition",level:100,cu:3},{code:"201",name:"Painting I",level:200,cu:3,lab:true},{code:"202",name:"Sculpture I",level:200,cu:3,lab:true},{code:"301",name:"Printmaking",level:300,cu:3,lab:true},{code:"302",name:"History of Art",level:300,cu:3},{code:"401",name:"Art Criticism and Aesthetics",level:400,cu:3},{code:"402",name:"Art Education",level:400,cu:3}],
  GEM:[{code:"101",name:"Introduction to Geomatics",level:100,cu:3},{code:"102",name:"Surveying I",level:100,cu:3,lab:true},{code:"201",name:"Surveying II",level:200,cu:3,lab:true},{code:"202",name:"Geodetic Surveying",level:200,cu:3},{code:"301",name:"Photogrammetry and Remote Sensing",level:300,cu:3},{code:"302",name:"Geographical Information Systems",level:300,cu:3,lab:true},{code:"401",name:"Cadastral Surveying and Land Administration",level:400,cu:3},{code:"402",name:"GPS and GNSS Technology",level:400,cu:3}],
  IND:[{code:"101",name:"Introduction to Industrial Design",level:100,cu:3},{code:"102",name:"Basic Design and Colour Theory",level:100,cu:3},{code:"201",name:"Product Design I",level:200,cu:3},{code:"202",name:"Ceramics Design",level:200,cu:3,lab:true},{code:"301",name:"Industrial Design Methods",level:300,cu:3},{code:"302",name:"Ergonomics and Human Factors",level:300,cu:3},{code:"401",name:"Design for Sustainability",level:400,cu:3},{code:"402",name:"Product Development and Prototyping",level:400,cu:3,lab:true}],
  QSV:[{code:"101",name:"Introduction to Quantity Surveying",level:100,cu:3},{code:"102",name:"Construction Economics",level:100,cu:2},{code:"201",name:"Measurement of Building Works I",level:200,cu:3},{code:"202",name:"Building Estimating and Pricing",level:200,cu:3},{code:"301",name:"Measurement of Engineering Works",level:300,cu:3},{code:"302",name:"Contract Law and Administration",level:300,cu:3},{code:"401",name:"Life Cycle Costing",level:400,cu:3},{code:"402",name:"Construction Project Management",level:400,cu:3}],
  URP:[{code:"101",name:"Introduction to Urban and Regional Planning",level:100,cu:3},{code:"102",name:"Planning Theory",level:100,cu:2},{code:"201",name:"Site Analysis and Planning",level:200,cu:3},{code:"202",name:"Transportation Planning",level:200,cu:3},{code:"301",name:"Regional Planning Techniques",level:300,cu:3},{code:"302",name:"Urban Economics and Land Policy",level:300,cu:3},{code:"401",name:"Environmental Planning and Management",level:400,cu:3},{code:"402",name:"Planning Law and Administration",level:400,cu:3}],
  ILW:[{code:"101",name:"Introduction to Islamic Law",level:100,cu:3},{code:"102",name:"Islamic Jurisprudence I",level:100,cu:3},{code:"201",name:"Islamic Family Law",level:200,cu:3},{code:"202",name:"Islamic Commercial Law",level:200,cu:3},{code:"301",name:"Islamic Criminal Law",level:300,cu:3},{code:"302",name:"Islamic Law of Succession",level:300,cu:3},{code:"401",name:"Islamic Constitutional Law",level:400,cu:3},{code:"402",name:"Contemporary Issues in Islamic Law",level:400,cu:3}],
  PBL:[{code:"101",name:"Introduction to Nigerian Legal System",level:100,cu:3},{code:"102",name:"Constitutional Law I",level:100,cu:3},{code:"201",name:"Constitutional Law II",level:200,cu:3},{code:"202",name:"Administrative Law",level:200,cu:3},{code:"301",name:"International Law I",level:300,cu:3},{code:"302",name:"Human Rights Law",level:300,cu:3},{code:"401",name:"Electoral Law and Democracy",level:400,cu:3},{code:"402",name:"Environmental Law",level:400,cu:3}],
  CML:[{code:"101",name:"Principles of Commercial Law",level:100,cu:3},{code:"102",name:"Business Law",level:100,cu:3},{code:"201",name:"Company Law I",level:200,cu:3},{code:"202",name:"Law of Banking",level:200,cu:3},{code:"301",name:"Industrial and Labour Law",level:300,cu:3},{code:"302",name:"Intellectual Property Law",level:300,cu:3},{code:"401",name:"International Trade Law",level:400,cu:3},{code:"402",name:"Oil and Gas Law",level:400,cu:3}],
  PRL:[{code:"101",name:"Law of Contract I",level:100,cu:3},{code:"102",name:"Law of Torts I",level:100,cu:3},{code:"201",name:"Law of Contract II",level:200,cu:3},{code:"202",name:"Law of Equity and Trusts",level:200,cu:3},{code:"301",name:"Law of Property",level:300,cu:3},{code:"302",name:"Family Law",level:300,cu:3},{code:"401",name:"Law of Succession and Wills",level:400,cu:3},{code:"402",name:"Alternative Dispute Resolution",level:400,cu:3}],
  BCH:[{code:"101",name:"Introduction to Biochemistry",level:100,cu:3},{code:"102",name:"Cell Biology",level:100,cu:3},{code:"201",name:"Molecular Biology",level:200,cu:3,lab:true},{code:"202",name:"Enzymology",level:200,cu:3,lab:true},{code:"301",name:"Metabolic Biochemistry",level:300,cu:3},{code:"302",name:"Clinical Biochemistry",level:300,cu:3,lab:true},{code:"401",name:"Nutritional Biochemistry",level:400,cu:3},{code:"402",name:"Research Methods in Biochemistry",level:400,cu:3}],
  BSC:[{code:"101",name:"General Biology I",level:100,cu:3,lab:true},{code:"102",name:"General Biology II",level:100,cu:3,lab:true},{code:"201",name:"Genetics and Cytology",level:200,cu:3},{code:"202",name:"Ecology and Conservation",level:200,cu:3},{code:"301",name:"Cell and Molecular Biology",level:300,cu:3},{code:"302",name:"Evolution and Biodiversity",level:300,cu:3},{code:"401",name:"Bioinformatics",level:400,cu:3,lab:true},{code:"402",name:"Biotechnology",level:400,cu:3}],
  BOT:[{code:"101",name:"Introduction to Botany",level:100,cu:3,lab:true},{code:"102",name:"Plant Anatomy and Morphology",level:100,cu:3},{code:"201",name:"Plant Taxonomy",level:200,cu:3,lab:true},{code:"202",name:"Plant Physiology",level:200,cu:3},{code:"301",name:"Plant Ecology",level:300,cu:3},{code:"302",name:"Economic Botany",level:300,cu:3},{code:"401",name:"Plant Biotechnology",level:400,cu:3,lab:true},{code:"402",name:"Palaeobotany",level:400,cu:3}],
  MCB:[{code:"101",name:"Introduction to Microbiology",level:100,cu:3,lab:true},{code:"102",name:"General Microbiology",level:100,cu:3},{code:"201",name:"Bacteriology",level:200,cu:3,lab:true},{code:"202",name:"Mycology and Virology",level:200,cu:3,lab:true},{code:"301",name:"Industrial Microbiology",level:300,cu:3},{code:"302",name:"Food Microbiology",level:300,cu:3,lab:true},{code:"401",name:"Immunology",level:400,cu:3,lab:true},{code:"402",name:"Environmental Microbiology",level:400,cu:3}],
  ZOO:[{code:"101",name:"Introduction to Zoology",level:100,cu:3,lab:true},{code:"102",name:"Animal Diversity",level:100,cu:3},{code:"201",name:"Comparative Vertebrate Anatomy",level:200,cu:3,lab:true},{code:"202",name:"Animal Physiology",level:200,cu:3},{code:"301",name:"Parasitology",level:300,cu:3,lab:true},{code:"302",name:"Entomology",level:300,cu:3},{code:"401",name:"Wildlife Biology and Conservation",level:400,cu:3},{code:"402",name:"Aquatic Biology",level:400,cu:3}],
  CHM:[{code:"101",name:"General Chemistry I",level:100,cu:3,lab:true},{code:"102",name:"General Chemistry II",level:100,cu:3,lab:true},{code:"201",name:"Physical Chemistry I",level:200,cu:3},{code:"202",name:"Organic Chemistry I",level:200,cu:3,lab:true},{code:"301",name:"Inorganic Chemistry I",level:300,cu:3},{code:"302",name:"Analytical Chemistry I",level:300,cu:3,lab:true},{code:"401",name:"Polymer Chemistry",level:400,cu:3},{code:"402",name:"Industrial and Environmental Chemistry",level:400,cu:3}],
  CSC:[{code:"101",name:"Introduction to Computer Science",level:100,cu:3},{code:"102",name:"Introduction to Programming",level:100,cu:3,lab:true},{code:"201",name:"Data Structures and Algorithms",level:200,cu:3,lab:true},{code:"202",name:"Database Systems",level:200,cu:3,lab:true},{code:"301",name:"Operating Systems",level:300,cu:3},{code:"302",name:"Computer Networks",level:300,cu:3,lab:true},{code:"401",name:"Artificial Intelligence",level:400,cu:3},{code:"402",name:"Software Engineering",level:400,cu:3}],
  GEG:[{code:"101",name:"Introduction to Geography",level:100,cu:3},{code:"102",name:"Physical Geography",level:100,cu:3},{code:"201",name:"Human Geography",level:200,cu:3},{code:"202",name:"Climatology",level:200,cu:3},{code:"301",name:"Regional Geography of West Africa",level:300,cu:3},{code:"302",name:"Medical Geography",level:300,cu:3},{code:"401",name:"Population and Development Geography",level:400,cu:3},{code:"402",name:"Geographic Information Systems",level:400,cu:3,lab:true}],
  GEO:[{code:"101",name:"Introduction to Geology",level:100,cu:3},{code:"102",name:"Physical Geology",level:100,cu:3,lab:true},{code:"201",name:"Mineralogy",level:200,cu:3,lab:true},{code:"202",name:"Petrology",level:200,cu:3},{code:"301",name:"Structural Geology",level:300,cu:3},{code:"302",name:"Stratigraphy and Sedimentology",level:300,cu:3},{code:"401",name:"Economic Geology",level:400,cu:3},{code:"402",name:"Environmental Geology",level:400,cu:3}],
  MTH:[{code:"101",name:"General Mathematics I",level:100,cu:3},{code:"102",name:"General Mathematics II",level:100,cu:3},{code:"201",name:"Linear Algebra I",level:200,cu:3},{code:"202",name:"Calculus II",level:200,cu:3},{code:"301",name:"Real Analysis I",level:300,cu:3},{code:"302",name:"Complex Analysis",level:300,cu:3},{code:"401",name:"Numerical Analysis",level:400,cu:3},{code:"402",name:"Mathematical Modelling",level:400,cu:3}],
  PHY:[{code:"101",name:"General Physics I",level:100,cu:3,lab:true},{code:"102",name:"General Physics II",level:100,cu:3,lab:true},{code:"201",name:"Classical Mechanics",level:200,cu:3},{code:"202",name:"Electromagnetism I",level:200,cu:3},{code:"301",name:"Quantum Mechanics I",level:300,cu:3},{code:"302",name:"Thermal and Statistical Physics",level:300,cu:3},{code:"401",name:"Solid State Physics",level:400,cu:3},{code:"402",name:"Nuclear and Particle Physics",level:400,cu:3}],
  STA:[{code:"101",name:"Introduction to Statistics",level:100,cu:3},{code:"102",name:"Probability Theory I",level:100,cu:3},{code:"201",name:"Statistical Inference I",level:200,cu:3},{code:"202",name:"Regression Analysis",level:200,cu:3},{code:"301",name:"Design and Analysis of Experiments",level:300,cu:3},{code:"302",name:"Survey Sampling Methods",level:300,cu:3},{code:"401",name:"Time Series Analysis",level:400,cu:3},{code:"402",name:"Applied Multivariate Analysis",level:400,cu:3}],
  MAC:[{code:"101",name:"Introduction to Mass Communication",level:100,cu:3},{code:"102",name:"History of Nigerian Media",level:100,cu:2},{code:"201",name:"News Writing and Reporting",level:200,cu:3},{code:"202",name:"Broadcast Journalism",level:200,cu:3},{code:"301",name:"Public Relations and Advertising",level:300,cu:3},{code:"302",name:"Media Research Methods",level:300,cu:3},{code:"401",name:"Digital and Online Journalism",level:400,cu:3},{code:"402",name:"Media Ethics and Law",level:400,cu:3}],
  POL:[{code:"101",name:"Introduction to Political Science",level:100,cu:3},{code:"102",name:"Nigerian Government and Politics",level:100,cu:3},{code:"201",name:"Comparative Politics",level:200,cu:3},{code:"202",name:"International Relations",level:200,cu:3},{code:"301",name:"Political Theory",level:300,cu:3},{code:"302",name:"African Political Systems",level:300,cu:3},{code:"401",name:"Foreign Policy Analysis",level:400,cu:3},{code:"402",name:"Research Methods in Political Science",level:400,cu:3}],
  SOC:[{code:"101",name:"Introduction to Sociology",level:100,cu:3},{code:"102",name:"Sociological Theory I",level:100,cu:3},{code:"201",name:"Social Statistics",level:200,cu:3},{code:"202",name:"Social Psychology",level:200,cu:3},{code:"301",name:"Sociology of Development",level:300,cu:3},{code:"302",name:"Criminology and Deviance",level:300,cu:3},{code:"401",name:"Sociology of Religion",level:400,cu:3},{code:"402",name:"Research Methods in Sociology",level:400,cu:3}],
  VTM:[{code:"101",name:"Introduction to Veterinary Medicine",level:100,cu:3},{code:"102",name:"Veterinary Orientation",level:100,cu:2},{code:"201",name:"Veterinary Anatomy I",level:200,cu:3,lab:true},{code:"202",name:"Veterinary Physiology I",level:200,cu:3,lab:true},{code:"301",name:"Veterinary Pathology",level:300,cu:3,lab:true},{code:"302",name:"Veterinary Pharmacology",level:300,cu:3},{code:"401",name:"Veterinary Internal Medicine",level:400,cu:3},{code:"402",name:"Veterinary Diagnostic Imaging",level:400,cu:3}],
  VPH:[{code:"101",name:"Introduction to Veterinary Public Health",level:100,cu:3},{code:"201",name:"Food Hygiene and Inspection",level:200,cu:3,lab:true},{code:"202",name:"Epidemiology",level:200,cu:3},{code:"301",name:"Zoonoses",level:300,cu:3},{code:"302",name:"Environmental Health",level:300,cu:3},{code:"401",name:"Veterinary Meat Hygiene",level:400,cu:3,lab:true},{code:"402",name:"One Health Approaches",level:400,cu:3}],
  VAP:[{code:"101",name:"Veterinary Gross Anatomy I",level:100,cu:3,lab:true},{code:"102",name:"Veterinary Histology",level:100,cu:3,lab:true},{code:"201",name:"Veterinary Gross Anatomy II",level:200,cu:3,lab:true},{code:"202",name:"Veterinary Biochemistry",level:200,cu:3,lab:true},{code:"301",name:"Avian Anatomy and Physiology",level:300,cu:3},{code:"302",name:"Comparative Animal Physiology",level:300,cu:3},{code:"401",name:"Neuroscience for Veterinarians",level:400,cu:3},{code:"402",name:"Endocrinology and Reproduction",level:400,cu:3}],
  VSG:[{code:"101",name:"Introduction to Veterinary Surgery",level:100,cu:3},{code:"201",name:"Veterinary Anaesthesiology",level:200,cu:3,lab:true},{code:"202",name:"Diagnostic Imaging",level:200,cu:3},{code:"301",name:"Large Animal Surgery",level:300,cu:3,lab:true},{code:"302",name:"Small Animal Surgery",level:300,cu:3,lab:true},{code:"401",name:"Orthopaedics and Fracture Repair",level:400,cu:3},{code:"402",name:"Soft Tissue Surgery",level:400,cu:3,lab:true}],
  VMT:[{code:"101",name:"Introduction to Veterinary Microbiology",level:100,cu:3,lab:true},{code:"201",name:"Veterinary Bacteriology",level:200,cu:3,lab:true},{code:"202",name:"Veterinary Virology",level:200,cu:3,lab:true},{code:"301",name:"Veterinary Mycology",level:300,cu:3,lab:true},{code:"302",name:"Veterinary Parasitology",level:300,cu:3,lab:true},{code:"401",name:"Veterinary Immunology",level:400,cu:3,lab:true},{code:"402",name:"Veterinary Vaccine Technology",level:400,cu:3}],
  PHA:[{code:"101",name:"Introduction to Pharmacy",level:100,cu:3},{code:"102",name:"Pharmaceutical Calculations",level:100,cu:3},{code:"201",name:"Pharmaceutics I",level:200,cu:3,lab:true},{code:"202",name:"Pharmacy Practice I",level:200,cu:3},{code:"301",name:"Pharmacognosy and Phytomedicine",level:300,cu:3,lab:true},{code:"302",name:"Clinical Pharmacy",level:300,cu:3},{code:"401",name:"Hospital and Community Pharmacy",level:400,cu:3},{code:"402",name:"Pharmaceutical Jurisprudence",level:400,cu:3}],
  PHM:[{code:"101",name:"Introduction to Pharmacology",level:100,cu:3},{code:"201",name:"Systemic Pharmacology I",level:200,cu:3},{code:"202",name:"Clinical Pharmacology",level:200,cu:3},{code:"301",name:"Toxicology",level:300,cu:3},{code:"302",name:"Chemotherapy",level:300,cu:3},{code:"401",name:"Pharmacokinetics",level:400,cu:3},{code:"402",name:"Drug Metabolism and Disposition",level:400,cu:3}],
  PHC:[{code:"101",name:"Pharmaceutical Chemistry I",level:100,cu:3,lab:true},{code:"201",name:"Pharmaceutical Chemistry II",level:200,cu:3,lab:true},{code:"202",name:"Medicinal Chemistry",level:200,cu:3},{code:"301",name:"Pharmaceutical Analysis",level:300,cu:3,lab:true},{code:"302",name:"Drug Design and Discovery",level:300,cu:3},{code:"401",name:"Pharmaceutical Biotechnology",level:400,cu:3},{code:"402",name:"Structure-Activity Relationships",level:400,cu:3}],
  PHT:[{code:"101",name:"Introduction to Pharmacognosy",level:100,cu:3,lab:true},{code:"201",name:"Pharmacognosy II",level:200,cu:3,lab:true},{code:"202",name:"Natural Products Chemistry",level:200,cu:3},{code:"301",name:"Herbal Drug Technology",level:300,cu:3,lab:true},{code:"302",name:"Ethnopharmacology",level:300,cu:3},{code:"401",name:"Phytotherapy",level:400,cu:3},{code:"402",name:"Quality Control of Herbal Medicines",level:400,cu:3,lab:true}],
}

const ROOMS = [
  {code:"MPH",    name:"Main Purpose Hall",         capacity:500,type:"EXAM_HALL"    as const,building:"Main Campus",      hasProjector:true, hasAC:true, hasComputers:false},
  {code:"LT1",    name:"Lecture Theatre 1",          capacity:350,type:"EXAM_HALL"    as const,building:"Faculty of Arts",  hasProjector:true, hasAC:true, hasComputers:false},
  {code:"LT2",    name:"Lecture Theatre 2",          capacity:300,type:"LECTURE_HALL" as const,building:"Science Block",    hasProjector:true, hasAC:true, hasComputers:false},
  {code:"LH1",    name:"Lecture Hall 100",           capacity:200,type:"LECTURE_HALL" as const,building:"Block A",         hasProjector:true, hasAC:false,hasComputers:false},
  {code:"LH2",    name:"Lecture Hall 200",           capacity:200,type:"LECTURE_HALL" as const,building:"Block B",         hasProjector:true, hasAC:false,hasComputers:false},
  {code:"LH3",    name:"Lecture Hall 300",           capacity:150,type:"LECTURE_HALL" as const,building:"Block C",         hasProjector:true, hasAC:false,hasComputers:false},
  {code:"LH4",    name:"Lecture Hall 400",           capacity:150,type:"LECTURE_HALL" as const,building:"Block D",         hasProjector:true, hasAC:false,hasComputers:false},
  {code:"CR1",    name:"Classroom Block A Room 1",   capacity:80, type:"CLASSROOM"    as const,building:"Block A",         hasProjector:false,hasAC:false,hasComputers:false},
  {code:"CR2",    name:"Classroom Block B Room 1",   capacity:80, type:"CLASSROOM"    as const,building:"Block B",         hasProjector:false,hasAC:false,hasComputers:false},
  {code:"CR3",    name:"Classroom Block C Room 1",   capacity:60, type:"CLASSROOM"    as const,building:"Block C",         hasProjector:false,hasAC:false,hasComputers:false},
  {code:"COMLAB1",name:"Computer Laboratory 1",      capacity:60, type:"COMPUTER_LAB" as const,building:"ICT Building",    hasProjector:true, hasAC:true, hasComputers:true},
  {code:"COMLAB2",name:"Computer Laboratory 2",      capacity:40, type:"COMPUTER_LAB" as const,building:"ICT Building",    hasProjector:true, hasAC:true, hasComputers:true},
  {code:"SCILAB1",name:"Science Laboratory 1",       capacity:50, type:"LABORATORY"   as const,building:"Science Block",   hasProjector:false,hasAC:false,hasComputers:false},
  {code:"SCILAB2",name:"Science Laboratory 2",       capacity:50, type:"LABORATORY"   as const,building:"Science Block",   hasProjector:false,hasAC:false,hasComputers:false},
  {code:"ENGLAB1",name:"Engineering Laboratory 1",   capacity:45, type:"LABORATORY"   as const,building:"Engineering Block",hasProjector:false,hasAC:true,hasComputers:false},
  {code:"SEMR1",  name:"Seminar Room 1",             capacity:30, type:"CLASSROOM"    as const,building:"Admin Building",  hasProjector:true, hasAC:true, hasComputers:false},
  {code:"SEMR2",  name:"Seminar Room 2",             capacity:30, type:"CLASSROOM"    as const,building:"Postgrad Building",hasProjector:true,hasAC:true, hasComputers:false},
]

const STUDENTS = [
  {regNumber:"FEDKO/2024/001",name:"Boruto Uzumaki",     deptCode:"CSC",level:100,admissionYear:2024,isSpillover:false},
  {regNumber:"FEDKO/2024/002",name:"Sarada Uchiha",      deptCode:"CVE",level:100,admissionYear:2024,isSpillover:false},
  {regNumber:"FEDKO/2024/003",name:"Mitsuki",            deptCode:"BCH",level:100,admissionYear:2024,isSpillover:false},
  {regNumber:"FEDKO/2024/004",name:"Denki Kaminarimon",  deptCode:"ECE",level:100,admissionYear:2024,isSpillover:false},
  {regNumber:"FEDKO/2024/005",name:"Wasabi Izuno",       deptCode:"MCB",level:100,admissionYear:2024,isSpillover:false},
  {regNumber:"FEDKO/2024/006",name:"Namida Suzumeno",    deptCode:"PHL",level:100,admissionYear:2024,isSpillover:false},
  {regNumber:"FEDKO/2024/007",name:"Tsubaki Kurogane",   deptCode:"ARC",level:100,admissionYear:2024,isSpillover:false},
  {regNumber:"FEDKO/2024/008",name:"Kawaki",             deptCode:"MTE",level:100,admissionYear:2024,isSpillover:false},
  {regNumber:"FEDKO/2024/009",name:"Shinki",             deptCode:"PHY",level:100,admissionYear:2024,isSpillover:false},
  {regNumber:"FEDKO/2024/010",name:"Yodo",               deptCode:"SOC",level:100,admissionYear:2024,isSpillover:false},
  {regNumber:"FEDKO/2023/001",name:"Gaara",              deptCode:"POL",level:200,admissionYear:2023,isSpillover:false},
  {regNumber:"FEDKO/2023/002",name:"Temari",             deptCode:"STA",level:200,admissionYear:2023,isSpillover:false},
  {regNumber:"FEDKO/2023/003",name:"Kankuro",            deptCode:"IND",level:200,admissionYear:2023,isSpillover:false},
  {regNumber:"FEDKO/2023/004",name:"Metal Lee",          deptCode:"MCE",level:200,admissionYear:2023,isSpillover:false},
  {regNumber:"FEDKO/2023/005",name:"Inojin Yamanaka",    deptCode:"FNA",level:200,admissionYear:2023,isSpillover:false},
  {regNumber:"FEDKO/2023/006",name:"Himawari Uzumaki",   deptCode:"BOT",level:200,admissionYear:2023,isSpillover:false},
  {regNumber:"FEDKO/2023/007",name:"Iwabe Yuino",        deptCode:"PET",level:200,admissionYear:2023,isSpillover:false},
  {regNumber:"FEDKO/2023/008",name:"Sumire Kakei",       deptCode:"MTH",level:200,admissionYear:2023,isSpillover:false},
  {regNumber:"FEDKO/2023/009",name:"Samui",              deptCode:"ACC",level:200,admissionYear:2023,isSpillover:false},
  {regNumber:"FEDKO/2023/010",name:"Omoi",               deptCode:"CHM",level:200,admissionYear:2023,isSpillover:false},
  {regNumber:"FEDKO/2023/011",name:"Karui",              deptCode:"MAC",level:200,admissionYear:2023,isSpillover:false},
  {regNumber:"FEDKO/2023/012",name:"Killer B Jr",        deptCode:"ELS",level:200,admissionYear:2023,isSpillover:false},
  {regNumber:"FEDKO/2022/001",name:"Naruto Uzumaki",     deptCode:"POL",level:300,admissionYear:2022,isSpillover:true},
  {regNumber:"FEDKO/2022/002",name:"Sasuke Uchiha",      deptCode:"ECE",level:300,admissionYear:2022,isSpillover:false},
  {regNumber:"FEDKO/2022/003",name:"Hinata Hyuga",       deptCode:"PRL",level:300,admissionYear:2022,isSpillover:false},
  {regNumber:"FEDKO/2022/004",name:"Choji Akimichi",     deptCode:"ANS",level:300,admissionYear:2022,isSpillover:false},
  {regNumber:"FEDKO/2022/005",name:"Tenten",             deptCode:"MET",level:300,admissionYear:2022,isSpillover:false},
  {regNumber:"FEDKO/2022/006",name:"Neji Hyuga",         deptCode:"PHY",level:300,admissionYear:2022,isSpillover:false},
  {regNumber:"FEDKO/2022/007",name:"Kiba Inuzuka",       deptCode:"VTM",level:300,admissionYear:2022,isSpillover:true},
  {regNumber:"FEDKO/2022/008",name:"Shikadai Nara",      deptCode:"QSV",level:300,admissionYear:2022,isSpillover:false},
  {regNumber:"FEDKO/2022/009",name:"Chocho Akimichi",    deptCode:"THA",level:300,admissionYear:2022,isSpillover:false},
  {regNumber:"FEDKO/2022/010",name:"Karin Uzumaki",      deptCode:"BSC",level:300,admissionYear:2022,isSpillover:false},
  {regNumber:"FEDKO/2022/011",name:"Moegi Kazamatsuri",  deptCode:"ELS",level:300,admissionYear:2022,isSpillover:false},
  {regNumber:"FEDKO/2022/012",name:"Udon Ise",           deptCode:"CHN",level:300,admissionYear:2022,isSpillover:false},
  {regNumber:"FEDKO/2021/001",name:"Shikamaru Nara",     deptCode:"STA",level:400,admissionYear:2021,isSpillover:false},
  {regNumber:"FEDKO/2021/002",name:"Ino Yamanaka",       deptCode:"BOT",level:400,admissionYear:2021,isSpillover:false},
  {regNumber:"FEDKO/2021/003",name:"Sakura Haruno",      deptCode:"PHA",level:400,admissionYear:2021,isSpillover:false},
  {regNumber:"FEDKO/2021/004",name:"Rock Lee",           deptCode:"MCE",level:400,admissionYear:2021,isSpillover:true},
  {regNumber:"FEDKO/2021/005",name:"Sai",                deptCode:"FNA",level:400,admissionYear:2021,isSpillover:false},
  {regNumber:"FEDKO/2021/006",name:"Konohamaru Sarutobi",deptCode:"PAD",level:400,admissionYear:2021,isSpillover:false},
  {regNumber:"FEDKO/2020/001",name:"Kakashi Hatake",     deptCode:"MTH",level:500,admissionYear:2020,isSpillover:false},
  {regNumber:"FEDKO/2020/002",name:"Tsunade",            deptCode:"PHM",level:500,admissionYear:2020,isSpillover:false},
  {regNumber:"FEDKO/2020/003",name:"Might Guy",          deptCode:"MCE",level:500,admissionYear:2020,isSpillover:false},
]

async function purge() {
  const insts = await db.institution.findMany({where:{shortName:'FEDKO'},select:{id:true}})
  const ids = insts.map(i=>i.id)
  if (!ids.length) return {purged:0}
  const users = await db.user.findMany({where:{institutionId:{in:ids}},select:{id:true}})
  const uids = users.map(u=>u.id)
  let n=0
  n+=(await db.invigilatorAssignment.deleteMany({where:{examSlot:{examPeriod:{institutionId:{in:ids}}}}})).count
  n+=(await db.conflict.deleteMany({where:{examPeriod:{institutionId:{in:ids}}}})).count
  n+=(await db.examSlot.deleteMany({where:{examPeriod:{institutionId:{in:ids}}}})).count
  n+=(await db.blackoutDate.deleteMany({where:{examPeriod:{institutionId:{in:ids}}}})).count
  n+=(await db.conflictReport.deleteMany({where:{examPeriod:{institutionId:{in:ids}}}})).count
  n+=(await db.timetableVersion.deleteMany({where:{examPeriod:{institutionId:{in:ids}}}})).count
  n+=(await db.examPeriod.deleteMany({where:{institutionId:{in:ids}}})).count
  n+=(await db.lectureSlot.deleteMany({where:{lectureTimetable:{institutionId:{in:ids}}}})).count
  n+=(await db.lectureTimetable.deleteMany({where:{institutionId:{in:ids}}})).count
  n+=(await db.coursePrerequisite.deleteMany({where:{OR:[{course:{institutionId:{in:ids}}},{prerequisite:{institutionId:{in:ids}}}]}})).count
  n+=(await db.studentCourse.deleteMany({where:{course:{institutionId:{in:ids}}}})).count
  n+=(await db.notification.deleteMany({where:{userId:{in:uids}}})).count
  n+=(await db.activityLog.deleteMany({where:{userId:{in:uids}}})).count
  n+=(await db.student.deleteMany({where:{department:{faculty:{institutionId:{in:ids}}}}})).count
  n+=(await db.lecturer.deleteMany({where:{department:{faculty:{institutionId:{in:ids}}}}})).count
  n+=(await db.course.deleteMany({where:{institutionId:{in:ids}}})).count
  n+=(await db.room.deleteMany({where:{institutionId:{in:ids}}})).count
  n+=(await db.department.deleteMany({where:{faculty:{institutionId:{in:ids}}}})).count
  n+=(await db.faculty.deleteMany({where:{institutionId:{in:ids}}})).count
  n+=(await db.user.deleteMany({where:{institutionId:{in:ids}}})).count
  n+=(await db.institution.deleteMany({where:{id:{in:ids}}})).count
  return {purged:n}
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-seed-secret')
  if (!secret || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({error:'Unauthorized'},{status:401})
  }

  const log: string[] = []
  try {
    const {purged} = await purge()
    log.push(`Purged ${purged} records`)

    const inst = await db.institution.create({data:INSTITUTION_DATA})
    const iid = inst.id
    log.push(`Institution: ${inst.shortName}`)

    const pw = await bcrypt.hash('demo1234',10)
    await db.user.createMany({data:[
      {email:'admin@fedko.edu.ng',   name:'Hiruzen Sarutobi',role:'IA',passwordHash:pw,institutionId:iid,isActive:true},
      {email:'officer@fedko.edu.ng', name:'Iruka Umino',     role:'TO',passwordHash:pw,institutionId:iid,isActive:true},
      {email:'lecturer@fedko.edu.ng',name:'Kakashi Hatake',  role:'LC',passwordHash:pw,institutionId:iid,isActive:true},
      {email:'student@fedko.edu.ng', name:'Naruto Uzumaki',  role:'ST',passwordHash:pw,institutionId:iid,isActive:true},
    ]})
    log.push('Users: 4')

    await db.faculty.createMany({data:FACULTIES.map(f=>({institutionId:iid,...f}))})
    log.push(`Faculties: ${FACULTIES.length}`)

    const facs = await db.faculty.findMany({where:{institutionId:iid}})
    const fm = Object.fromEntries(facs.map(f=>[f.code,f.id]))
    const depts = Object.entries(DEPARTMENTS).flatMap(([fc,ds])=>ds.map(d=>({facultyId:fm[fc],code:d.code,name:d.name,hodName:d.hod})))
    await db.department.createMany({data:depts})
    log.push(`Departments: ${depts.length}`)

    const deps = await db.department.findMany({where:{faculty:{institutionId:iid}}})
    const dm = Object.fromEntries(deps.map(d=>[d.code,d.id]))

    const courseRows: {institutionId:string;departmentId:string;code:string;name:string;creditUnits:number;level:number;semester:number;requiresLab:boolean;maxStudents:number}[] = []
    for (const [dc,ts] of Object.entries(COURSES)) {
      const did=dm[dc]; if(!did) continue
      for (const t of ts) courseRows.push({institutionId:iid,departmentId:did,code:`FUK-${dc} ${t.code}`,name:t.name,creditUnits:t.cu,level:t.level,semester:2,requiresLab:t.lab||false,maxStudents:t.level===100?200:t.level===200?150:t.level===300?100:80})
    }
    for (let i=0;i<courseRows.length;i+=100) await db.course.createMany({data:courseRows.slice(i,i+100)})
    log.push(`Courses: ${courseRows.length}`)

    const lecRows = deps.map(d=>({departmentId:d.id,staffId:`FUK/${d.code}/HOD`,name:d.hodName||'TBD',email:`${d.code.toLowerCase()}.hod@fedko.edu.ng`,rank:'Senior Lecturer',unavailableDays:JSON.stringify([])}))
    await db.lecturer.createMany({data:lecRows})
    const lecs = await db.lecturer.findMany({where:{department:{faculty:{institutionId:iid}}}})
    for (const l of lecs) await db.course.updateMany({where:{departmentId:l.departmentId,institutionId:iid},data:{lecturerId:l.id}})
    log.push(`Lecturers: ${lecRows.length}`)

    await db.room.createMany({data:ROOMS.map(r=>({institutionId:iid,...r}))})
    log.push(`Rooms: ${ROOMS.length}`)

    const stdRows = STUDENTS.map(s=>({departmentId:dm[s.deptCode],regNumber:s.regNumber,name:s.name,email:`${s.regNumber.replace(/\//g,'.').toLowerCase()}@fedko.edu.ng`,level:s.level,admissionYear:s.admissionYear,isSpillover:s.isSpillover}))
    await db.student.createMany({data:stdRows})
    log.push(`Students: ${stdRows.length}`)

    const courses = await db.course.findMany({where:{institutionId:iid}})
    const stds = await db.student.findMany({where:{department:{faculty:{institutionId:iid}}}})
    const sm = Object.fromEntries(stds.map(s=>[s.regNumber,s.id]))
    const session='2025/2026'; const sem=2
    const enrRows: {studentId:string;courseId:string;status:string;semester:number;session:string}[] = []
    for (const s of STUDENTS) {
      const sid=sm[s.regNumber]; if(!sid) continue
      const cur=courses.filter(c=>c.departmentId===dm[s.deptCode]&&c.level===s.level&&c.semester===sem)
      for (const c of cur) enrRows.push({studentId:sid,courseId:c.id,status:'REGISTERED',semester:sem,session})
      if (s.isSpillover&&s.level>=200) {
        const co=courses.filter(c=>c.departmentId===dm[s.deptCode]&&c.level===s.level-100&&c.semester===sem).slice(0,2)
        for (const c of co) if (!enrRows.find(e=>e.studentId===sid&&e.courseId===c.id)) enrRows.push({studentId:sid,courseId:c.id,status:'CARRY_OVER',semester:sem,session})
      }
    }
    for (let i=0;i<enrRows.length;i+=100) await db.studentCourse.createMany({data:enrRows.slice(i,i+100)})
    log.push(`Enrollments: ${enrRows.length} (${enrRows.filter(e=>e.status==='CARRY_OVER').length} carry-over)`)

    const ep = await db.examPeriod.create({data:{institutionId:iid,name:'Second Semester Examination 2025/2026',session,semester:sem,startDate:new Date('2025-08-04'),endDate:new Date('2025-08-29'),slotsPerDay:3,slotDuration:180,morningStart:'08:00',morningEnd:'11:00',afternoonStart:'12:00',afternoonEnd:'15:00',eveningStart:'16:00',eveningEnd:'19:00',includeSaturday:true,excludeFridays:true,status:'GENERATED'}})

    const allEnr = await db.studentCourse.findMany({where:{session,semester:sem},select:{studentId:true,courseId:true}})
    const cs: Record<string,Set<string>> = {}
    for (const e of allEnr) { if (!cs[e.courseId]) cs[e.courseId]=new Set(); cs[e.courseId].add(e.studentId) }
    const allRms = await db.room.findMany({where:{institutionId:iid},orderBy:{capacity:'desc'}})
    const rb = Object.fromEntries(allRms.map(r=>[r.code,r.id]))

    const dates: Date[] = []
    const c2=new Date('2025-08-04'); const e2=new Date('2025-08-29')
    while(c2<=e2){const d=c2.getDay();if(d>=1&&d<=6&&d!==5)dates.push(new Date(c2));c2.setDate(c2.getDate()+1)}

    const socc: Record<string,string[]> = {}
    const slots: {examPeriodId:string;courseId:string;roomId:string;date:Date;dayOfWeek:number;slotNumber:number;startTime:string;endTime:string;status:string}[] = []
    const sc=courses.filter(c=>c.semester===sem).sort((a,b)=>(cs[b.id]?.size||0)-(cs[a.id]?.size||0))
    for (const course of sc) {
      const enr=cs[course.id]?.size||0
      let rid=enr>350?rb['MPH']:enr>300?rb['LT1']:enr>250?rb['LT2']:enr>150?rb['LH1']||rb['LH2']:enr>100?rb['LH3']||rb['LH4']:enr>60?rb['CR1']||rb['CR2']:course.requiresLab?rb['SCILAB1']||rb['ENGLAB1']||rb['COMLAB1']:rb['CR3']||rb['SEMR1']
      if (!rid) rid=allRms[0].id
      const myS=cs[course.id]||new Set()
      let ok=false
      for (let di=0;di<dates.length&&!ok;di++) for (let sn=1;sn<=3&&!ok;sn++) {
        const k=`${di}-${sn}`; const occ=socc[k]||[]; let cl=false
        for (const oid of occ) { const os=cs[oid]; if(!os) continue; for (const sid of myS){if(os.has(sid)){cl=true;break;}} if(cl) break }
        if (!cl) { const d=dates[di]; const t=[['08:00','11:00'],['12:00','15:00'],['16:00','19:00']][sn-1]; slots.push({examPeriodId:ep.id,courseId:course.id,roomId:rid,date:d,dayOfWeek:d.getDay(),slotNumber:sn,startTime:t[0],endTime:t[1],status:'SCHEDULED'}); socc[k]=[...occ,course.id]; ok=true }
      }
    }
    for (let i=0;i<slots.length;i+=50) await db.examSlot.createMany({data:slots.slice(i,i+50)})
    log.push(`Exam Slots: ${slots.length}`)

    const lt=await db.lectureTimetable.create({data:{institutionId:iid,name:'Second Semester Lecture Timetable 2025/2026',session,semester:sem,startDate:new Date('2025-02-17'),endDate:new Date('2025-06-28'),status:'PUBLISHED'}})
    const lcRows: {lectureTimetableId:string;courseId:string;roomId:string;dayOfWeek:number;startTime:string;endTime:string;isRecurring:boolean;status:string}[] = []
    const locc: Record<string,string[]>= {}
    for (const course of courses.filter(c=>c.level<=200&&c.semester===sem)) {
      const enr=cs[course.id]?.size||0
      const rid=enr>150?rb['LH1']:enr>80?rb['LH3']:course.requiresLab?rb['SCILAB1']:rb['CR1']
      if (!rid) continue
      const myS=cs[course.id]||new Set()
      for (let day=1;day<=6;day++) {
        for (const time of ['08:00','10:00','12:00','14:00']) {
          const k=`${day}-${time}`; const occ=locc[k]||[]; let cl=false
          for (const oid of occ){const os=cs[oid];if(!os)continue;for(const sid of myS){if(os.has(sid)){cl=true;break;}}if(cl)break}
          if(!cl){const eh=parseInt(time.split(':')[0])+2;lcRows.push({lectureTimetableId:lt.id,courseId:course.id,roomId:rid,dayOfWeek:day,startTime:time,endTime:`${String(eh).padStart(2,'0')}:00`,isRecurring:true,status:'ACTIVE'});locc[k]=[...occ,course.id];break}
        }
        if (lcRows.find(s=>s.courseId===course.id)) break
      }
    }
    for (let i=0;i<lcRows.length;i+=50) await db.lectureSlot.createMany({data:lcRows.slice(i,i+50)})
    log.push(`Lecture Slots: ${lcRows.length}`)

    await db.conflictReport.create({data:{examPeriodId:ep.id,totalConflicts:0,criticalCount:0,warningCount:0,infoCount:0,status:'APPROVED'}})
    await db.timetableVersion.create({data:{examPeriodId:ep.id,version:1,isCurrent:true,publishedAt:new Date(),changes:JSON.stringify({action:'Seed v3 — Nigerian venues + Naruto names',slots:slots.length})}})

    const fedUsers=await db.user.findMany({where:{institutionId:iid},select:{id:true}})
    await db.notification.createMany({data:fedUsers.map(u=>({userId:u.id,title:'Exam Timetable Published',message:'Second Semester 2025/2026 exam timetable is now available.',type:'SCHEDULE_CHANGE',actionUrl:'/dashboard'}))})
    log.push('Notifications sent')

    return NextResponse.json({success:true, log, summary:{faculties:FACULTIES.length,departments:depts.length,courses:courseRows.length,students:STUDENTS.length,rooms:ROOMS.length,examSlots:slots.length,lectureSlots:lcRows.length}})
  } catch(e:any) {
    return NextResponse.json({success:false,error:e.message,log},{status:500})
  }
}
