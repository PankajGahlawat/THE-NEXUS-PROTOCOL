export interface MissionObjective {
    id: number;
    role: 'Red Team' | 'Blue Team';
    title: string;
    description: string;
    prompt: string;
    flag: string; // The correct answer
    points: number;
    completed: boolean;
    required: boolean;
    hint?: string;
    maxAttempts?: number;
}

export interface MissionData {
    id: string;
    name: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    duration: number; // in seconds
    traceThreshold: number; // 0-100
    phases: number;
    objectives: MissionObjective[];
}

export const MISSIONS: MissionData[] = [
    {
        id: "stage-1",
        name: "Stage 1: The Perimeter Breach",
        description: "Reconnaissance is the first step of any successful breach. Identify the target's weaknesses.",
        difficulty: "Easy",
        duration: 900, // 15 minutes
        traceThreshold: 30,
        phases: 1,
        objectives: [
            {
                id: 101,
                role: "Red Team",
                title: "The Hidden Directory",
                description: "Reconnaissance is the first step of any successful breach. We suspect the target has misconfigured their web server permissions. Perform a directory brute-force or manual check to find the backup folder.",
                prompt: "Access the server at `http://target-site.com/dev/backup/`. There is a text file containing the first flag. What is the content of `flag.txt`?",
                flag: "CTF{B4ckup_Exposur3_2026}",
                points: 30, // Stage 1 Reward
                completed: false,
                required: true
            },
            {
                id: 102,
                role: "Blue Team",
                title: "The Vulnerable Plugin",
                description: "Our automated scanners have flagged a high-risk vulnerability in the 'Broken Walls' plugin. You need to identify the exact vulnerability to justify an emergency patch.",
                prompt: "Search the National Vulnerability Database (NVD) for 'Broken Walls v1.2'. What is the CVE ID associated with this Remote Code Execution (RCE) flaw?",
                flag: "CVE-2024-8892",
                points: 30, // Stage 1 Reward
                completed: false,
                required: true
            }
        ]
    },
    {
        id: "stage-2",
        name: "Stage 2: Lateral Movement",
        description: "The attacker has breached the perimeter. Now they are moving laterally through the network.",
        difficulty: "Medium",
        duration: 1200, // 20 minutes
        traceThreshold: 50,
        phases: 1,
        objectives: [
            {
                id: 201,
                role: "Red Team",
                title: "The SQL Bypass",
                description: "The login portal at `/admin/login.php` doesn't sanitize inputs correctly. Use a SQL injection string to bypass the authentication gate.",
                prompt: "Inject a `' OR 1=1 --` style payload into the username field. Once inside, the admin dashboard will display a secret token. Enter it here.",
                flag: "TOKEN_SQLI_MASTER_99",
                points: 40, // Stage 2 Reward
                completed: false,
                required: true
            },
            {
                id: 202,
                role: "Blue Team",
                title: "Trace the Shell",
                description: "A web shell has been uploaded to the `/uploads/` directory. We need to know exactly what the attacker did once they got in.",
                prompt: "Check the server `cmd_history.log`. The attacker ran three commands: `whoami`, `ls -la`, and `cat /etc/passwd`. Which command was executed at timestamp `14:22:05`?",
                flag: "ls -la",
                points: 40, // Stage 2 Reward
                completed: false,
                required: true
            }
        ]
    },
    {
        id: "stage-3",
        name: "Stage 3: Data Exfiltration",
        description: "Critical data is being stolen. Stop the exfiltration and identify the method.",
        difficulty: "Hard",
        duration: 1500, // 25 minutes
        traceThreshold: 80,
        phases: 1,
        objectives: [
            {
                id: 301,
                role: "Red Team",
                title: "The Image Secret",
                description: "The final prize is encrypted, but the key is hidden in plain sight on the 'About Us' page.",
                prompt: "Download `team_photo.png`. Use a strings analysis tool or a hex editor to find the hidden comment at the end of the file metadata. This is your decryption salt.",
                flag: "S4lty_D0g_2026",
                points: 30, // Stage 3 Reward
                completed: false,
                required: true
            },
            {
                id: 302,
                role: "Blue Team",
                title: "Kill the Process",
                description: "The server is slowing down. A malicious process is draining resources and sending data to an unknown C2 (Command & Control) server.",
                prompt: "Review the running processes. One process is named `sys_update.exe` but is running from the `C:\\Users\\Public\\` folder instead of `C:\\Windows\\`. What is the PID of this malicious process?",
                flag: "4412",
                points: 30, // Stage 3 Reward
                completed: false,
                required: true
            }
        ]
    }
];
