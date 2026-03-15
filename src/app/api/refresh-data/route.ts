import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST(): Promise<NextResponse> {
    return new Promise((resolve) => {
        // Resolve the directory where the python script lives
        const quantDir = path.resolve(process.cwd(), '../Quant/Python/regime_detection_allocation');

        // Command drops into the folder, activates venv (if present), and runs main.py
        const command = `cd "${quantDir}" && if [ -d ".venv" ]; then source .venv/bin/activate; fi && python3 main.py`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing python script: ${error}`);
                console.error(`stderr: ${stderr}`);
                return resolve(NextResponse.json({ success: false, error: stderr }, { status: 500 }));
            }
            resolve(NextResponse.json({ success: true, message: stdout }));
        });
    });
}
