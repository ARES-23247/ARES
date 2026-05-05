import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Run the generation script
    const { stdout, stderr } = await execAsync("npm run generate:sims", {
      cwd: process.cwd(),
    });

    return Response.json({
      success: true,
      output: stdout,
      error: stderr,
    });
  } catch (error) {
    console.error("Failed to generate sim registry:", error);
    return Response.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
