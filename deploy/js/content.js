/* unemplyd. — site content. Edit copy here; layout code lives in main.js. */
window.SITE = {
  // Where every "Board now" button goes. Set to the real enrol/apply link.
  CTA_URL: "#learn",

  regions: [
    { where: "INDIA · HUB", title: "Programming", line: "The instincts every engineer builds first.",
      topics: ["Python · C · C++ · Java", "Problem decomposition", "Debugging habits"],
      code: "def solve(problem):\n    return build(understand(problem))", plain: "Turn a problem into working code." },
    { where: "NORTH AMERICA", title: "Data Structures & Algorithms", line: "The discipline behind every efficient solution.",
      topics: ["Arrays · trees · graphs", "Sorting & searching", "Dynamic programming"],
      code: "while (lo <= hi) {\n  mid = (lo + hi) >> 1;\n}", plain: "Find anything fast, at any scale." },
    { where: "EUROPE", title: "CS Fundamentals", line: "How systems work, underneath the frameworks.",
      topics: ["Operating systems", "Computer networks", "Databases"],
      code: "SYN → SYN-ACK → ACK", plain: "How machines share, schedule and speak." },
    { where: "EAST ASIA", title: "Software Engineering", line: "From working code to production software.",
      topics: ["Git & code review", "Testing", "System design"],
      code: "git push origin feature/ship-it", plain: "Code that a team can trust and ship." },
    { where: "SOUTH AMERICA", title: "Artificial Intelligence", line: "AI as a collaborator, not a shortcut.",
      topics: ["Machine learning basics", "Neural networks", "Building with LLMs"],
      code: "model.fit(X, y)\nmodel.predict(new_data)", plain: "Teach machines to learn from data." },
    { where: "AFRICA", title: "Embedded Systems", line: "Software that answers to real hardware.",
      topics: ["Microcontrollers (STM32, Arduino)", "Embedded C", "Sensors & IoT"],
      code: "HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);", plain: "Code that touches the physical world." },
    { where: "ARCTIC · N. EUROPE", title: "Cloud & Infrastructure", line: "Where software actually has to live.",
      topics: ["Linux", "Docker & containers", "Deploying to the cloud"],
      code: "docker build -t app . && docker run app", plain: "Run your software anywhere, reliably." },
    { where: "OCEANS · UNDERSEA CABLES", title: "Career Readiness", line: "Turning capability into an actual opportunity.",
      topics: ["Portfolio & GitHub", "Interview prep", "Internships"],
      code: "git commit -m \"ready for the interview\"", plain: "Turn your skills into an offer." }
  ],

  commits: [
    { t: "init", title: "Academic Learning", body: "The foundation every engineer starts from." },
    { t: "feat(lang)", title: "Programming Foundations", body: "Python, C, C++, Java. Syntax becomes instinct." },
    { t: "feat", title: "Software Development", body: "From scripts to real, structured systems.", tag: "branch → experience" },
    { t: "perf", title: "Data Structures & Algorithms", body: "The discipline behind every efficient solution." },
    { t: "feat(cs)", title: "Computer Science Fundamentals", body: "OS, networks, databases. How systems actually work." },
    { t: "merge", title: "Real-world Engineering", body: "Constraints, trade-offs and production thinking.", tag: "merge ← experience · Gate E", gate: "E" },
    { t: "feat(ai)", title: "Artificial Intelligence", body: "Building with and alongside intelligent systems." },
    { t: "feat", title: "Projects", body: "Ideas become shipped, working software.", tag: "branch → opportunity" },
    { t: "docs", title: "Professional Portfolio", body: "Proof of what you can actually build." },
    { t: "feat(industry)", title: "Internships", body: "Industry context, mentorship, real stakes." },
    { t: "merge", title: "Career Opportunities", body: "Interviews, offers, the first real role.", tag: "merge ← opportunity · Gate O", gate: "O" },
    { t: "loop", title: "Continuous Growth", body: "The journey that never really ends.", tag: "HEAD → career" }
  ],

  // Sample rows. Replace with the real course catalogue.
  courses: [
    ["UN-101", "PYTHON FOUNDATIONS", "6 WKS"],
    ["UN-204", "DSA MASTERY", "10 WKS"],
    ["UN-310", "FULL-STACK DEV", "12 WKS"],
    ["UN-420", "AI ENGINEERING", "8 WKS"],
    ["UN-505", "CLOUD & DEVOPS", "8 WKS"],
    ["UN-612", "EMBEDDED SYSTEMS", "10 WKS"]
  ],

  labs: [
    { name: "Terminal", what: "The interface underneath every other interface.", run: ["$ whoami", "future-engineer", "$ uptime", "up 2 a.m., 1 user, load: caffeine"] },
    { name: "Linux", what: "The OS every backend eventually runs on.", run: ["$ uname -sr", "Linux 6.8.0", "$ ls /home/you", "projects  notes  dreams"] },
    { name: "Git", what: "Every serious engineer's memory of every decision.", run: ["$ git init", "Initialized empty Git repository", "$ git commit -m \"first\"", "[main (root-commit) a1b2c3d] first"] },
    { name: "GitHub", what: "Where your work becomes visible to recruiters.", run: ["$ git push origin main", "To github.com:you/portfolio.git", " * [new branch]  main -> main"] },
    { name: "VS Code", what: "Where most of the actual building happens.", run: ["$ code .", "Opening workspace: ~/projects/campus-connect", "✓ 0 problems"] },
    { name: "Docker", what: "Ship the same environment from laptop to production.", run: ["$ docker run hello-world", "Hello from Docker!", "This message shows your installation appears to be working correctly."] },
    { name: "Packet Tracer", what: "Simulate real networks before you touch a router.", run: ["PC0> ping 192.168.1.1", "Reply from 192.168.1.1: bytes=32 time<1ms", "Packets: Sent = 4, Received = 4, Lost = 0"] },
    { name: "STM32CubeIDE", what: "Program real microcontrollers, not simulations.", run: ["> Build Project: blink", "arm-none-eabi-gcc ... OK", "> Flash: Download verified successfully"] },
    { name: "Keil", what: "Embedded C, compiled for real hardware limits.", run: ["Build target 'Target 1'", "compiling main.c...", "\"blink.axf\" - 0 Error(s), 0 Warning(s)."] },
    { name: "Vivado", what: "FPGA design for those who go deeper than software.", run: ["> synth_design -top counter", "Synthesis finished", "> write_bitstream counter.bit"] },
    { name: "Arduino IDE", what: "Fastest path from idea to blinking LED.", run: ["Compiling sketch...", "Sketch uses 924 bytes (2%) of program storage.", "Done uploading."] },
    { name: "Figma", what: "Design the interface before you write frontend code.", run: ["> Export frame: Login / Desktop", "login@2x.png  ✓", "Handoff link copied"] },
    { name: "AI Dev Tools", what: "Copilot and agents, used deliberately.", run: ["> explain this stack trace", "NullPointerException at line 42: user is undefined.", "> you fix it, then I review"] }
  ],

  projects: [
    { id: "UN-01", name: "Campus Connect", hook: "Placement coordination, without the spreadsheet drift.",
      problem: "Placement cells track hundreds of students and companies across spreadsheets that fall out of sync within a week.",
      solution: "A shared platform where placement officers, recruiters and students see the same real-time pipeline, from eligibility to offer.",
      stack: ["Next.js", "PostgreSQL", "Prisma", "Tailwind CSS"],
      concepts: ["Relational data modeling", "Role-based access control", "Real-time sync"], shipped: true },
    { id: "UN-02", name: "PathFinder AI", hook: "Case file being written.", pending: true },
    { id: "UN-03", name: "SentryNode", hook: "Case file being written.", pending: true },
    { id: "UN-04", name: "DeployKit", hook: "Case file being written.", pending: true }
  ]
};
