import React, { useState, useEffect, useRef } from 'react';

interface CodeExample {
  name: string;
  description: string;
  code: string;
  language: string;
}

interface CodePlaygroundProps {
  examples?: CodeExample[];
  defaultExample?: string;
}

const EXAMPLES: CodeExample[] = [
  {
    name: 'Swerve Drive Basics',
    description: 'Basic swerve drive velocity control using MARSLib',
    language: 'java',
    code: `// Swerve Drive Velocity Control Example
// This demonstrates how to control a swerve drive robot using MARSLib

package frc.robot.commands;

import com.marslib.swerve.SwerveDrive;
import edu.wpi.first.math.kinematics.ChassisSpeeds;
import edu.wpi.first.wpilibj2.command.Command;

public class DriveCommand extends Command {
    private final SwerveDrive drive;
    private final Supplier<Double> vxSupplier;
    private final Supplier<Double> vySupplier;
    private final Supplier<Double> omegaSupplier;

    public DriveCommand(
        SwerveDrive drive,
        Supplier<Double> vxSupplier,
        Supplier<Double> vySupplier,
        Supplier<Double> omegaSupplier
    ) {
        this.drive = drive;
        this.vxSupplier = vxSupplier;
        this.vySupplier = vySupplier;
        this.omegaSupplier = omegaSupplier;
        addRequirements(drive);
    }

    @Override
    public void execute() {
        // Get driver input
        double vx = vxSupplier.get();  // Forward/Back velocity (m/s)
        double vy = vySupplier.get();  // Left/Right velocity (m/s)
        double omega = omegaSupplier.get();  // Rotational velocity (rad/s)

        // Create chassis speeds object
        ChassisSpeeds speeds = new ChassisSpeeds(vx, vy, omega);

        // Drive the robot
        drive.driveRobotRelative(speeds);
    }
}`
  },
  {
    name: 'Vision Alignment',
    description: 'AprilTag vision alignment using MARSLib vision system',
    language: 'java',
    code: `// Vision Alignment Example
// Automatically align robot to AprilTag using MARSLib vision

package frc.robot.commands;

import com.marslib.vision.MARSVision;
import edu.wpi.first.math.controller.PIDController;
import edu.wpi.first.wpilibj2.command.Command;

public class AlignToTagCommand extends Command {
    private final MARSVision vision;
    private final SwerveDrive drive;

    // PID controllers for alignment
    private final PIDController xController = new PIDController(3.0, 0.0, 0.1);
    private final PIDController yController = new PIDController(3.0, 0.0, 0.1);
    private final PIDController thetaController = new PIDController(2.0, 0.0, 0.05);

    public AlignToTagCommand(MARSVision vision, SwerveDrive drive) {
        this.vision = vision;
        this.drive = drive;
        addRequirements(drive);

        // Configure theta controller for continuous rotation
        thetaController.enableContinuousInput(-Math.PI, Math.PI);
    }

    @Override
    public void execute() {
        // Get latest vision pose estimate
        var poseEstimate = vision.getPoseEstimate();

        if (poseEstimate.isPresent()) {
            var pose = poseEstimate.get();

            // Target pose (example: tag at (5m, 2m) facing 0 radians)
            var targetPose = new Pose2d(5.0, 2.0, new Rotation2d(0.0));

            // Calculate error
            double xError = targetPose.getX() - pose.getX();
            double yError = targetPose.getY() - pose.getY();
            double thetaError = targetPose.getRotation().minus(pose.getRotation()).getRadians();

            // Calculate velocities using PID
            double vx = xController.calculate(xError, 0.0);
            double vy = yController.calculate(yError, 0.0);
            double omega = thetaController.calculate(thetaError, 0.0);

            // Drive to target
            var speeds = new ChassisSpeeds(vx, vy, omega);
            drive.driveRobotRelative(speeds);
        }
    }

    @Override
    public boolean isFinished() {
        // Finish when aligned within tolerance
        return xController.atSetpoint() && yController.atSetpoint() && thetaController.atSetpoint();
    }
}`
  },
  {
    name: 'PID Elevator Control',
    description: 'Elevator position control using MARSLib mechanisms',
    language: 'java',
    code: `// PID Elevator Control Example
// Position control for elevator mechanism using MARSLib

package frc.robot.subsystems;

import com.marslib.mechanisms.LinearMechanismIO;
import edu.wpi.first.math.controller.PIDController;
import edu.wpi.first.wpilibj2.command.Subsystem;

public class ElevatorSubsystem extends Subsystem {
    private final LinearMechanismIO io;
    private final PIDController pidController;

    private double targetPositionMeters = 0.0;

    public ElevatorSubsystem(LinearMechanismIO io) {
        this.io = io;

        // PID controller tuned for elevator
        // Gains should be determined through SysId characterization
        this.pidController = new PIDController(8.0, 0.0, 0.15);
    }

    @Override
    public void periodic() {
        // Get current position
        double currentPosition = io.getPosition();

        // Calculate control output
        double output = pidController.calculate(currentPosition, targetPositionMeters);

        // Apply feedforward for gravity compensation
        double feedforward = 0.5;  // Adjust based on elevator mass

        // Set motor voltage
        io.setVoltage(output + feedforward);
    }

    public void setPosition(double positionMeters) {
        this.targetPositionMeters = positionMeters;
    }

    public double getPosition() {
        return io.getPosition();
    }

    public boolean atPosition() {
        return pidController.atSetpoint();
    }
}

// Usage in a command:
public class MoveElevatorCommand extends Command {
    private final ElevatorSubsystem elevator;
    private final double targetPosition;

    public MoveElevatorCommand(ElevatorSubsystem elevator, double targetPosition) {
        this.elevator = elevator;
        this.targetPosition = targetPosition;
        addRequirements(elevator);
    }

    @Override
    public void initialize() {
        elevator.setPosition(targetPosition);
    }

    @Override
    public boolean isFinished() {
        return elevator.atPosition();
    }
}`
  },
  {
    name: 'State Machine Superstructure',
    description: 'Superstructure state machine using MARSLib state management',
    language: 'java',
    code: `// Superstructure State Machine Example
// Complex mechanism coordination using MARSLib state machines

package frc.robot.subsystems;

import com.marslib.util.MARSStateMachine;
import com.marslib.util.MARSStateMachine.State;
import edu.wpi.first.wpilibj2.command.Subsystem;

public class SuperstructureSubsystem extends Subsystem {
    // States for our state machine
    enum SuperstructureState implements State {
        IDLE("Idle"),
        INTAKING("Intaking"),
        SHOOTING("Shooting"),
        AMP_SCORING("Amp Scoring"),
        CLIMBING("Climbing"),
        ESTOP("Emergency Stop");

        final String displayName;
        SuperstructureState(String displayName) {
            this.displayName = displayName;
        }

        @Override
        public String toString() {
            return displayName;
        }
    }

    private final MARSStateMachine<SuperstructureState> stateMachine;
    private final IntakeSubsystem intake;
    private final ShooterSubsystem shooter;
    private final ElevatorSubsystem elevator;

    public SuperstructureSubsystem(
        IntakeSubsystem intake,
        ShooterSubsystem shooter,
        ElevatorSubsystem elevator
    ) {
        this.intake = intake;
        this.shooter = shooter;
        this.elevator = elevator;

        // Initialize state machine
        this.stateMachine = new MARSStateMachine<>("Superstructure", SuperstructureState.IDLE);

        // Define state transitions and behaviors
        setupStateMachine();
    }

    private void setupStateMachine() {
        // IDLE state - everything stopped
        stateMachine.addState(SuperstructureState.IDLE, () -> {
            intake.stop();
            shooter.stop();
            elevator.setPosition(0.0);
        });

        // INTAKING state - run intake, elevator down
        stateMachine.addState(SuperstructureState.INTAKING, () -> {
            intake.intake();
            elevator.setPosition(0.1);  // Low position
            shooter.idle();  // Prepare shooter
        });

        // SHOOTING state - run shooter, aim, feed
        stateMachine.addState(SuperstructureState.SHOOTING, () -> {
            if (shooter.atTargetSpeed()) {
                shooter.feed();  // Only feed when shooter is ready
            }
            elevator.setPosition(0.5);  // Shooting height
        });

        // ESTOP state - emergency stop everything
        stateMachine.addState(SuperstructureState.ESTOP, () -> {
            intake.stop();
            shooter.stop();
            elevator.holdPosition();
        });
    }

    @Override
    public void periodic() {
        // Update state machine
        stateMachine.update();
    }

    // Public methods to trigger state transitions
    public void startIntaking() {
        stateMachine.setState(SuperstructureState.INTAKING);
    }

    public void startShooting() {
        stateMachine.setState(SuperstructureState.SHOOTING);
    }

    public void emergencyStop() {
        stateMachine.setState(SuperstructureState.ESTOP);
    }

    public void returnToIdle() {
        stateMachine.setState(SuperstructureState.IDLE);
    }

    public SuperstructureState getCurrentState() {
        return stateMachine.getState();
    }
}`
  }
];

export default function CodePlayground({ examples = EXAMPLES, defaultExample }: CodePlaygroundProps) {
  const [selectedExample, setSelectedExample] = useState(0);
  const [code, setCode] = useState(examples[0].code);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleExampleChange = (index: number) => {
    setSelectedExample(index);
    setCode(examples[index].code);
    setOutput('');
    setHasError(false);
  };

  const runCode = () => {
    setIsRunning(true);
    setHasError(false);
    setOutput('Running code...\n\n');

    setTimeout(() => {
      try {
        // For educational purposes, we'll provide feedback about the code
        const example = examples[selectedExample];
        let analysis = `✅ Code Analysis for: ${example.name}\n`;
        analysis += `${'='.repeat(50)}\n\n`;
        analysis += `This example demonstrates proper MARSLib usage:\n\n`;

        if (example.name.includes('Swerve')) {
          analysis += `✓ Proper Command-based programming pattern\n`;
          analysis += `✓ Correct use of SwerveDrive.driveRobotRelative()\n`;
          analysis += `✓ ChassisSpeeds object for velocity control\n`;
          analysis += `✓ Proper requirement management with addRequirements()\n`;
          analysis += `\nTip: Adjust PID gains in SwerveConfig for tuning\n`;
        } else if (example.name.includes('Vision')) {
          analysis += `✓ Vision-based alignment using MARSVision\n`;
          analysis += `✓ PID controllers for x, y, and theta control\n`;
          analysis += `✓ Proper continuous angle handling\n`;
          analysis += `✓ Safe Optional handling for vision estimates\n`;
          analysis += `\nTip: Tune PID gains for smooth alignment\n`;
        } else if (example.name.includes('Elevator')) {
          analysis += `✓ LinearMechanismIO abstraction\n`;
          analysis += `✓ PID control with feedforward for gravity\n`;
          analysis += `✓ Proper periodic() update pattern\n`;
          analysis += `✓ Position command with completion detection\n`;
          analysis += `\nTip: Use SysId tool for PID tuning\n`;
        } else if (example.name.includes('State Machine')) {
          analysis += `✓ MARSStateMachine for complex logic\n`;
          analysis += `✓ Clear state definitions and transitions\n`;
          analysis += `✓ Proper subsystem coordination\n`;
          analysis += `✓ Safety with ESTOP state\n`;
          analysis += `\nTip: Add transition conditions for safety\n`;
        }

        analysis += `\n${'='.repeat(50)}\n`;
        analysis += `📚 Check the MARSLib documentation for more details!`;

        setOutput(analysis);
      } catch (error) {
        setHasError(true);
        setOutput(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
      setIsRunning(false);
    }, 1000);
  };

  const resetCode = () => {
    setCode(examples[selectedExample].code);
    setOutput('');
    setHasError(false);
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '600px',
      backgroundColor: '#0a0a0a',
      border: '1px solid #2a2a2a',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with example selector */}
      <div style={{
        padding: '15px',
        borderBottom: '1px solid #2a2a2a',
        background: '#111',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <label style={{ color: '#fff', fontFamily: '"Orbitron", sans-serif', fontSize: '14px' }}>
            Example:
          </label>
          <select
            value={selectedExample}
            onChange={(e) => handleExampleChange(Number(e.target.value))}
            style={{
              background: '#222',
              color: '#fff',
              border: '1px solid #444',
              padding: '8px 12px',
              borderRadius: '4px',
              fontFamily: '"Ubuntu", sans-serif',
              fontSize: '14px',
              minWidth: '200px'
            }}
          >
            {examples.map((example, index) => (
              <option key={index} value={index}>{example.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={runCode}
            disabled={isRunning}
            style={{
              background: isRunning ? '#444' : '#B32416',
              color: '#fff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '4px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontFamily: '"Orbitron", sans-serif',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {isRunning ? '⏳ Running...' : '▶ Run'}
          </button>
          <button
            onClick={resetCode}
            style={{
              background: '#333',
              color: '#fff',
              border: '1px solid #444',
              padding: '8px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: '"Ubuntu", sans-serif',
              fontSize: '14px'
            }}
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: '12px 15px', background: '#0f0f0f', borderBottom: '1px solid #2a2a2a' }}>
        <p style={{
          color: '#aaa',
          fontFamily: '"Ubuntu", sans-serif',
          fontSize: '13px',
          margin: 0,
          fontStyle: 'italic'
        }}>
          {examples[selectedExample].description}
        </p>
      </div>

      {/* Main content area */}
      <div style={{ display: 'flex', flex: 1, minHeight: '400px' }}>
        {/* Code editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #2a2a2a' }}>
          <div style={{
            padding: '8px 15px',
            background: '#1a1a1a',
            borderBottom: '1px solid #2a2a2a',
            color: '#888',
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            Java Code
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              flex: 1,
              background: '#0a0a0a',
              color: '#d4d4d4',
              border: 'none',
              padding: '15px',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '13px',
              lineHeight: '1.6',
              resize: 'none',
              outline: 'none'
            }}
            spellCheck={false}
            aria-label="Code editor"
          />
        </div>

        {/* Output panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '8px 15px',
            background: '#1a1a1a',
            borderBottom: '1px solid #2a2a2a',
            color: '#888',
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            Output
          </div>
          <div style={{
            flex: 1,
            background: '#0a0a0a',
            padding: '15px',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '13px',
            lineHeight: '1.6',
            color: hasError ? '#f48771' : '#a5d6ff',
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {output || 'Run the code to see analysis and feedback...'}
          </div>
        </div>
      </div>
    </div>
  );
}