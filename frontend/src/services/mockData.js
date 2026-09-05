// Sovereign Industrial Workbench - Core Datasets & Consistent Collections

export const INITIAL_MODELS = [
  { key: "document", name: "Document Drafter", capability: "text", ollama_tag: "phi3.5:3.8b" },
  { key: "coder", name: "Code Sandbox", capability: "code", ollama_tag: "qwen2.5-coder:3b" },
  { key: "vision", name: "Vision Analyst", capability: "vision", ollama_tag: "moondream" }
];

export const INITIAL_NETWORK_STATUS = {
  status: "AIR_GAPPED",
  external_connections: 0,
  local_connections: 3,
  details: [
    { service: "Local Inference Engine", host: "127.0.0.1:11434", type: "Unix/TCP Loopback", status: "CONNECTED", egress_blocked: true },
    { service: "Vector Knowledge Store", host: "127.0.0.1:8000", type: "Internal IPC", status: "CONNECTED", egress_blocked: true },
    { service: "Execution Sandbox Daemon", host: "/var/run/docker.sock", type: "Local Unix Socket", status: "CONNECTED", egress_blocked: true }
  ],
  timestamp: new Date().toISOString()
};

// Consistent Knowledge Collections (247 indexed industrial documents across refinery domains)
export const KNOWLEDGE_COLLECTIONS = [
  {
    id: "col-engineering",
    name: "ENGINEERING",
    count: 114,
    documents: [
      {
        id: "doc-pump-specs",
        name: "Pump_Specifications_P17.pdf",
        type: "pdf",
        pages: 42,
        size: "3.8 MB",
        date: "2026-07-15",
        pageIndex: [
          { title: "1. Datasheet: BB2 Heavy Duty Slurry Pump", page: 1 },
          { title: "2. Impeller Clearance & Metallurgy Spec", page: 19 },
          { title: "3. Mechanical Seal Auxiliary Flushing Piping", page: 42 }
        ]
      },
      {
        id: "doc-asme-b31",
        name: "ASME_B31.3_Process_Piping.pdf",
        type: "pdf",
        pages: 312,
        size: "18.2 MB",
        date: "2026-06-01",
        pageIndex: [
          { title: "Chapter II: Design Criteria & Allowables", page: 22 },
          { title: "Table A-1: Basic Allowable Stresses (Sa)", page: 140 },
          { title: "Appendix D: Flexibility & Stress Factors", page: 280 }
        ]
      },
      {
        id: "doc-cdu2-inspection",
        name: "CDU2_Column_C101_Ultrasonic_Inspection.pdf",
        type: "pdf",
        pages: 18,
        size: "3.4 MB",
        date: "2026-08-14",
        pageIndex: [
          { title: "1. Equipment Data & Inspection Scope", page: 1 },
          { title: "2. Ultrasonic Shell Thickness Grid", page: 6 },
          { title: "3. Corrosion Velocity & Remaining Life", page: 14 }
        ]
      }
    ]
  },
  {
    id: "col-operations",
    name: "OPERATIONS",
    count: 86,
    documents: [
      {
        id: "doc-safety-manual",
        name: "SAFETY_MANUAL.pdf",
        type: "pdf",
        pages: 247,
        size: "12.4 MB",
        date: "2026-08-10",
        pageIndex: [
          { title: "1. Facility Scope & Safe Work Codes", page: 1 },
          { title: "2. Standard Operating Procedures", page: 14 },
          { title: "3. Equipment Handling & Pressure Relief", page: 32 },
          { title: "4. Maintenance & Vibration Limits", page: 47 }
        ]
      },
      {
        id: "doc-maint-guide",
        name: "Maintenance_Guide_MRPL.pdf",
        type: "pdf",
        pages: 88,
        size: "4.1 MB",
        date: "2026-08-12",
        pageIndex: [
          { title: "1. Predictive Maintenance Schedules", page: 1 },
          { title: "2. Lubrication Regimes & Bearing Standards", page: 18 },
          { title: "3. Mechanical Seal Flushing Plans", page: 34 }
        ]
      },
      {
        id: "doc-pid-drawing",
        name: "MRPL_Crude_Preheat_Train_E102_PID.png",
        type: "png",
        pages: 1,
        size: "1.8 MB",
        date: "2026-08-20",
        pageIndex: [
          { title: "Sheet 1: E-102 Heat Exchanger Bypass & PSV-204", page: 1 }
        ]
      }
    ]
  },
  {
    id: "col-incidents",
    name: "INCIDENTS",
    count: 47,
    documents: [
      {
        id: "doc-maint-042",
        name: "Maintenance_Report_042.pdf",
        type: "pdf",
        pages: 24,
        size: "2.6 MB",
        date: "2026-08-28",
        pageIndex: [
          { title: "1. Incident Executive Summary", page: 1 },
          { title: "2. Operational Timeline of Trips (Pump 17)", page: 8 },
          { title: "3. Root Cause: Section 3.2 Seal Flush Choke", page: 17 },
          { title: "4. Corrective Mitigation & Signoff", page: 22 }
        ]
      },
      {
        id: "doc-insp-043",
        name: "Inspection_Report_043.docx",
        type: "docx",
        pages: 12,
        size: "1.5 MB",
        date: "2026-08-30",
        pageIndex: [
          { title: "1. Overhead Vapor Line Ultrasonic Profile", page: 1 },
          { title: "2. Flange Leakage at Flare Tie-In", page: 6 }
        ]
      }
    ]
  }
];

// Document Pages for Verification Viewer
export const DOCUMENT_PAGES = {
  "Maintenance_Report_042.pdf": {
    17: {
      title: "MAINTENANCE REPORT 042 // SECTION 3.2: ROOT CAUSE ANALYSIS",
      subtitle: "INVESTIGATION OF REPEATED TRIPS ON BOOSTER PUMP P-17",
      highlight: "Repeated failures are primarily associated with particulate clogging in the API Plan 31 cyclone separator orifice",
      content: `3.2 ROOT CAUSE ANALYSIS: BOOSTER PUMP P-17 REPEATED TRIPS

Investigation Team: Reliability Engineering & Maintenance Services
Asset Tag: P-17 (Crude Bottoms Booster Pump, BB2 Between-Bearings)
Failure History: 3 unplanned shutdowns within 45 operating days (June–August 2026).

DETAILED FINDINGS:
1. SEAL FLUSHING DEGRADATION:
   Disassembly of the failed tandem mechanical seal on 24-August-2026 revealed severe abrasive grooving on the rotating Silicon Carbide (SiC) face.
   
   The root cause is traced to particulate clogging in the API Plan 31 cyclone separator orifice (Tag: CY-17B). Heavy catalyst fines and iron sulfide scale from upstream desalter effluent accumulated in the cyclone underflow nozzle, reducing clean seal flushing from 12.0 L/min to less than 1.4 L/min.

2. THERMAL RUNAWAY & BEARING OVERHEATING:
   Lack of adequate flush circulation caused dry frictional heating (>185°C) at the seal interface. Vaporization of the crude bottoms boundary layer generated high frequency vibration spikes (peaking at 9.4 mm/s RMS), which subsequently damaged the drive-end angular contact thrust bearing.

3. REQUIRED CORRECTIVE MITIGATION:
   - Replace API Plan 31 cyclone system with API Plan 53B pressurized dual barrier seal with external glycol cooling.
   - Install continuous differential pressure transmitter (PDT-1714) across the flush loop with auto-alarm to DCS.`
    }
  },
  "Pump_Specifications_P17.pdf": {
    42: {
      title: "PUMP SPECIFICATIONS P-17 // PAGE 42: SEAL PIPING & LIMITS",
      subtitle: "API 610 11th EDITION // BETWEEN BEARINGS TWO-STAGE (BB2)",
      content: `PAGE 42: AUXILIARY PIPING SCHEMATICS (SEAL FLUSH PLAN 31)

- FLUID HANDLED: Atmospheric Residue / Reduced Crude
- PUMPING TEMPERATURE: 345°C Normal / 365°C Design
- SHAFT SPEED: 2980 RPM
- IMPELLER DIAMETER: 385 mm
- MINIMUM CONTINUOUS STABLE FLOW: 140 m³/hr
- MECHANICAL SEAL TYPE: API 682 Category 2 / Type B / Arrangement 2
- MAXIMUM PERMISSIBLE CASING VIBRATION: 4.5 mm/s RMS (Unfiltered)
- ALLOWABLE NOZZLE LOADS: Per ASME B31.3 Table 5 Annex F.`
    }
  },
  "SAFETY_MANUAL.pdf": {
    47: {
      title: "SAFETY MANUAL // SECTION 4.1: INSPECTION SCHEDULE",
      subtitle: "MRPL INDUSTRIAL REFINERY SAFETY CODE — REV 2026",
      content: `4.1 INSPECTION SCHEDULE & VIBRATION MONITORING

All Class-1 process equipment including continuous duty centrifugal pumps, overhead fan coolers, and primary column bottoms transfer pumps must undergo periodic non-destructive evaluation per the following table:

1. DAILY MONITORING:
   - Overall vibration velocity (RMS) measured at outboard bearing housing in horizontal, vertical, and axial planes.
   - Bearing temperature threshold: Alert at 75°C, Auto-trip at 95°C.

2. MECHANICAL SEAL HEALTH (API PLAN 31 / PLAN 53A):
   - Cyclone separator pressure differential must remain within 0.8 - 1.2 kg/cm²g.
   - Any drop in flushing flow below 8.0 L/min requires immediate strainer inspection. Failure to maintain positive flushing pressure results in rapid particulate abrasion on silicon carbide primary seal faces.

3. EMERGENCY SHUTDOWN TRIGGERS:
   - High vibration exceeding 7.1 mm/s RMS (Zone C/D boundary per ISO 10816-3).
   - Inboard seal leakage exceeding 5 drops/minute of hazardous hydrocarbon.`
    }
  }
};

// Recent Work Items for Dashboard & Quick Launch
export const RECENT_WORK_ITEMS = [
  {
    id: "run-01",
    num: "01",
    title: "Pump failure analysis",
    subtitle: "Booster Pump P-17 repeated trips root cause investigation",
    meta: "3 sources · Verified · 4 min ago",
    status: "VERIFIED",
    query: "Why has Pump 17 experienced repeated failures?",
    documentName: "Maintenance_Report_042.pdf",
    page: 17,
    sources: [
      {
        documentName: "Maintenance_Report_042.pdf",
        page: 17,
        section: "Section 3.2",
        snippet: "Particulate clogging in the API Plan 31 cyclone separator orifice resulting in dry frictional seal heating and severe abrasive grooving."
      },
      {
        documentName: "Pump_Specifications_P17.pdf",
        page: 42,
        section: "Page 42",
        snippet: "API 682 Category 2 / Type B seal auxiliary flush Plan 31 design limits."
      },
      {
        documentName: "SAFETY_MANUAL.pdf",
        page: 47,
        section: "Section 4.1",
        snippet: "Vibration velocity (RMS) alert threshold at 7.1 mm/s; bearing temperature trip at 95°C."
      }
    ],
    answer: `### Root Cause Analysis: Repeated Booster Pump P-17 Failures\n\nRepeated failures on **Booster Pump P-17** (3 unplanned shutdowns within 45 operating days) are primarily associated with **seal flushing degradation**:\n\n- **Direct Root Cause**: Heavy catalyst fines and iron sulfide scale from desalter effluent accumulated in the **API Plan 31 cyclone separator underflow orifice** (Tag: \`CY-17B\`), reducing flush flow from **12.0 L/min to < 1.4 L/min**.\n- **Thermal Runaway**: Lack of positive flush circulation caused dry frictional heating (>185°C), vaporizing the crude bottoms boundary layer and triggering abrasive grooving across the rotating Silicon Carbide (\`SiC\`) seal faces.\n- **Vibration Tripping**: Severe face damage induced high-frequency vibration spikes peaking at **9.4 mm/s RMS** (exceeding the 7.1 mm/s ISO limit), resulting in drive-end angular contact thrust bearing fatigue.\n\n**Corrective Mitigation Plan**:\n1. Upgrade from Plan 31 to **API Plan 53B** pressurized dual barrier seal with external glycol cooling.\n2. Install continuous differential pressure transmitter \`PDT-1714\` with DCS auto-alarms.\n\nYou can verify the source evidence in **\`Maintenance_Report_042.pdf\` (Page 17)**.`
  },
  {
    id: "run-02",
    num: "02",
    title: "Inspection report → approval note",
    subtitle: "CDU-2 Column C-101 ultrasonic thickness review & turnaround cladding",
    meta: "1 source · Completed · 18 min ago",
    status: "COMPLETED",
    query: "Read the ultrasonic thickness inspection report for Column C-101 and draft turnaround note.",
    documentName: "CDU2_Column_C101_Ultrasonic_Inspection.pdf",
    page: 6,
    sources: [
      {
        documentName: "CDU2_Column_C101_Ultrasonic_Inspection.pdf",
        page: 6,
        section: "Grid Readings",
        snippet: "Tray Zone 14-18 shell minimum thickness measured at 8.4 mm against retirement limit 7.2 mm."
      }
    ],
    answer: `### Inspection Review & Turnaround Recommendation\n\nEvaluation of ultrasonic thickness measurements for **Column C-101** against ASME Section VIII Div 1 limits:\n\n- **Critical Area Identified**: Heavy Gas Oil Trays (Zones 14–18) currently measure **8.4 mm** (Nominal: 14.0 mm, Retirement limit: **7.2 mm**).\n- **Corrosion Velocity**: Accelerated at **0.42 mm/year**, projecting retirement threshold breach within ~34 months if unmitigated.\n- **Executive Deliverable**: Generated formal **Approval Note (\`.docx\`)** recommending SS-317L weld overlay cladding during the upcoming turnaround.`
  },
  {
    id: "run-03",
    num: "03",
    title: "P&ID visual analysis",
    subtitle: "Crude preheat train E-102 bypass loop and relief valve verification",
    meta: "2 images · Completed · Yesterday",
    status: "COMPLETED",
    query: "Verify P&ID schematic for crude preheat train heat exchanger E-102.",
    documentName: "MRPL_Crude_Preheat_Train_E102_PID.png",
    page: 1,
    sources: [
      {
        documentName: "MRPL_Crude_Preheat_Train_E102_PID.png",
        page: 1,
        section: "Sheet 1",
        snippet: "Relief valve PSV-204 set point 42.5 kg/cm2g discharging to high pressure flare header."
      }
    ],
    answer: `### P&ID Schematic Verification: Heat Exchanger E-102\n\nAnalysis completed across uploaded engineering drawings:\n\n- **Primary Relief System**: \`PSV-204\` set point verified at **42.5 kg/cm²g** (discharges to High Pressure Flare Header).\n- **Bypass Control Loop**: \`FV-104\` pneumatic globe valve with fail-open (FO) actuator on tube-side shell bypass.\n- **Compliance**: Conforms to **OISD-118 Section 4.2** safety instrumented parameters.`
  }
];

// Clean functional capability starters for the workspace query terminal
export const STARTER_SUGGESTIONS = [
  {
    id: "starter-docs",
    title: "DOCUMENT QUERY",
    subtitle: "Extract parameters and investigate operational incidents",
    prompt: "Search the knowledge base for equipment operating limits, safety protocols, and inspection schedules.",
    tag: "KNOWLEDGE SEARCH"
  },
  {
    id: "starter-code",
    title: "CALCULATION SANDBOX",
    subtitle: "Run thermal expansion and allowable stress equations",
    prompt: "Write and execute a Python script to calculate thermal expansion and allowable stress per ASME B31.3.",
    tag: "SECURE SANDBOX"
  },
  {
    id: "starter-report",
    title: "APPROVAL DRAFTER",
    subtitle: "Synthesize inspection logs into an executive turnaround note",
    prompt: "Draft an executive turnaround approval note summarizing asset integrity findings for Chief Engineer review.",
    tag: "REPORT DRAFTER"
  }
];

export const DEMO_PRESETS = STARTER_SUGGESTIONS;

export const INITIAL_KNOWLEDGE_BASE = [
  {
    id: "kb-001",
    name: "Maintenance_Report_042.pdf",
    file_type: "application/pdf",
    chunk_count: 36,
    size_mb: 2.6,
    timestamp: "2026-08-28 11:45:10",
    embedding_model: "nomic-embed-text (768-dim)",
    status: "INDEXED"
  },
  {
    id: "kb-002",
    name: "Pump_Specifications_P17.pdf",
    file_type: "application/pdf",
    chunk_count: 42,
    size_mb: 3.8,
    timestamp: "2026-07-15 10:20:00",
    embedding_model: "nomic-embed-text (768-dim)",
    status: "INDEXED"
  },
  {
    id: "kb-003",
    name: "SAFETY_MANUAL.pdf",
    file_type: "application/pdf",
    chunk_count: 148,
    size_mb: 12.4,
    timestamp: "2026-08-10 08:15:22",
    embedding_model: "nomic-embed-text (768-dim)",
    status: "INDEXED"
  },
  {
    id: "kb-004",
    name: "ASME_B31.3_Process_Piping.pdf",
    file_type: "application/pdf",
    chunk_count: 210,
    size_mb: 18.2,
    timestamp: "2026-06-01 14:00:00",
    embedding_model: "nomic-embed-text (768-dim)",
    status: "INDEXED"
  }
];

export const MOCK_FILES_INITIAL = [];

export const MOCK_DOCX_PREVIEW_HTML = ``;

export const MOCK_CODE_OUTPUT = {
  code: `# Unprivileged Execution Sandbox
def run():
    pass
`,
  stdout: ""
};

export const MOCK_SHEET_DATA = [];
