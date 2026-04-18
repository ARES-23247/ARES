UPDATE docs SET title = 'Untitled', description = '', content = '---
title: "I2C/RS485 Bus - Troubleshooting Guide"
description: "Fix I2C bus communication problems, motor errors, and connection issues."
sidebar:
  order: 4
---



I2C bus problems can make your robot behave strangely or not work at all. This guide helps you find and fix CAN issues fast.

## What is I2C/RS485 Bus?

**I2C/RS485 Bus** = Controller Area Network bus

It''s like a conversation where robot parts take turns talking on a shared wire. Instead of each device having its own wires, they all share one communication line.

**Think of it like**: A classroom where students raise their hands to speak. Only one person talks at a time, so everyone can understand.

---

## Quick Check (2 minutes)

### <span class="mars-num">1</span> Check CAN Status

**In Phoenix Tuner** (for CTRE devices):
1. Open Phoenix Tuner.
2. Look at the top bar.
3. Check "I2C/RS485 Bus Utilization" .
4. Check "I2C/RS485 Bus Status".

**What you want to see**:
- ✅ **Utilization**: Under 80% (ideally under 60%)
- ✅ **Status**: "OK" or "Connected".
- ✅ **Devices**: All your devices listed.

**What indicates problems**:
- ❌ **Utilization**: Over 80% (bus is congested)
- ❌ **Status**: "BUS OFF" or "Disconnected".
- ❌ **Devices**: Missing devices or red X''s.

**In OutlineViewer/SmartDashboard**:
- Look for "/CAN" folder.
- Check device health.
- Look for error messages.

### <span class="mars-num">2</span> Check Device Connection

**Look at your devices**:
1. Count how many motor controllers/sensors you have.
2. Compare to Phoenix Tuner list.
3. Are any missing?
4. Are any showing errors?

**Quick device count**:
- Swerve drive: 8-12 devices (4 Talon FX + 4 CANcoder + maybe more)
- Basic drivetrain: 4-6 devices.
- Shooter/intake: 2-4 devices.

### <span class="mars-num">3</span> Check for Error Messages

**Look in FTC Dashboard Log** for these errors:
```
- "CAN Receive Timeout"
- "CAN Transmit Error"  
- "Device not responding"
- "Invalid Device ID"
- "I2C/RS485 Bus Off"
```

**If you see these**: You have I2C bus problems. Continue with this guide.

---

## Common Problems and Solutions

### Problem 1: Device Not Detected

**Symptoms**:
- Device doesn''t appear in Phoenix Tuner.
- Device shows red X or error.
- Code can''t communicate with device.

**Causes**:

**1. Wrong Device ID**
```
Fix: Check device IDs match code
```

**In Phoenix Tuner**:
1. Select device.
2. Look at "Device ID" .
3. Compare to your code.

**In your code**:
```java
// Make sure IDs match!
private final TalonFX frontLeft = new TalonFX(1);  // Device ID 1
private final TalonFX frontRight = new TalonFX(2); // Device ID 2
```

**2. Device Not Powered**
```
Fix: Check power connections
```

- Verify main power connection (12V)
- Check breaker hasn''t tripped.
- Measure voltage at device with multimeter.
- Look for LED indicators on device.

**3. CAN Cable Loose/Disconnected**
```
Fix: Check and reconnect cables
```

- Follow CAN chain from robot to each device.
- Push cables in firmly.
- Check for damaged cables.
- Replace any suspect cables.

**4. Wrong I2C/RS485 Bus**
```
Fix: Verify I2C bus connection
```

**Control Hub CAN ports**:
- `CAN 0`: Primary I2C bus.
- `CAN 1`: Secondary I2C bus (if using CANivore)

**Make sure devices are on correct bus!**

---

### Problem 2: I2C/RS485 Bus Utilization Too High

**Symptoms**:
- Phoenix Tuner shows >80% utilization.
- Robot behaves randomly.
- Some devices work, others don''t.
- Performance issues.

**Causes**:

**1. Update Rates Too High**
```
Fix: Reduce update rates for non-critical signals
```

**What to update fast (100Hz)**:
- Drivetrain motor positions/velocities.
- Gyro data
- Critical sensor feedback.

**What to update slowly (10Hz or less)**:
- Motor temperatures.
- Supply current/voltage.
- Fault/status signals.
- Non-critical telemetry.

**How to fix**:
```java
// Fast updates for drivetrain (100Hz)
driveMotor.getPosition().setUpdateFrequency(100);
driveMotor.getVelocity().setUpdateFrequency(100);

// Slow updates for temperature (4Hz)
driveMotor.getDeviceTemp().setUpdateFrequency(4);
driveMotor.getSupplyCurrent().setUpdateFrequency(4);
```

**2. Too Many Devices on One Bus**
```
Fix: Use CANivore or reduce devices
```

**Signs you have too many devices**:
- More than 12 devices on one bus.
- Utilization consistently >70%.
- Random communication failures.

**Solutions**:
- Add CANivore device (splits into multiple I2C buses)
- Reduce update rates (see above)
- Remove unnecessary devices.

**3. CANivore Not Working**
```
Fix: Verify CANivore setup
```

**In code**:
```java
// When using CANivore, specify bus name
private final TalonFX motor = new TalonFX(1, "CANivore");  // Specify bus!
```

**Check**:
- CANivore powered (yellow LED)
- CANivore connected to Control Hub.
- Devices daisy-chained to CANivore.

---

### Problem 3: Intermittent CAN Errors

**Symptoms**:
- Robot works sometimes, not others.
- Random "CAN Timeout" errors.
- Devices drop in and out.
- Performance varies.

**Causes**:

**1. Poor Cable Quality**
```
Fix: Replace bad cables
```

**Signs of bad cables**:
- Crimps not secure.
- Wires pulling out of connectors.
- Visible damage to insulation.
- Cables too long (>6 feet)

**Use quality cables**:
- Crimped properly (not soldered)
- Right length for each connection.
- Strain relief where needed.
- Shielded cables for long runs.

**2. Chain Topology Wrong**
```
Fix: Arrange I2C bus in proper daisy chain
```

**Correct topology**:
```
Control Hub → Device 1 → Device 2 → Device 3 → ... → 120Ω terminator
```

**Wrong topologies**:
```
❌ Star topology (all devices to one point)
❌ Multiple terminators  
❌ Loops (don''t connect ends together)
❌ Missing terminator
```

**3. Loose Connections**
```
Fix: Secure all connections
```

- Check all CAN connectors.
- Add zip ties to prevent vibration loosening.
- Use strain relief on moving parts.
- Check for corrosion on contacts.

**4. Electrical Interference**
```
Fix: Route CAN away from power wires
```

- Don''t run CAN next to motor power wires.
- Cross power wires at 90° if you must cross.
- Use shielded CAN cables.
- Keep CAN away from radio power leads.

---

### Problem 4: I2C/RS485 Bus Off Error

**Symptoms**:
- Phoenix Tuner says "BUS OFF".
- All CAN devices stop working.
- Robot becomes unresponsive.

**Causes**:

**1. Short Circuit on I2C/RS485 Bus**
```
Fix: Find and fix short
```

**How to find**:
1. Disconnect all devices.
2. Add devices back one at a time.
3. When problem returns, you found the bad device.
4. Check that device''s CAN wiring.

**2. Missing Termination Resistor**
```
Fix: Add 120Ω terminator at end of chain
```

**Every I2C bus needs exactly one 120Ω terminator at the end**

**Check**:
- Control Hub has built-in terminator (usually)
- CANivore has built-in terminator.
- Some devices have built-in terminators.

**Verify**:
```
Control Hub --- Device1 --- Device2 --- 120Ω Terminator
```

**3. Too Many Devices**
```
Fix: Reduce device count or add CANivore
```

- More than ~15 devices on one bus.
- Add CANivore for more devices.

---

### Problem 5: Motor Controller Not Responding

**Symptoms**:
- Specific motor controller shows errors.
- Other devices work fine.
- Motor won''t move.

**Diagnosis**:

**Step 1: Check Device ID**
```java
// Make sure ID matches what you set in Phoenix Tuner
private final TalonFX motor = new TalonFX(deviceId);
```

**Step 2: Check for Firmware Updates**
- Open Phoenix Tuner.
- Check if firmware update available.
- Update firmware (takes ~30 seconds per device)

**Step 3: Check Configuration**
```java
// Verify configuration actually applied
StatusCode status = motor.getConfigurator().apply(config);
if (!status.isOK()) {
    System.out.println("Config failed: " + status);
}
```

**Step 4: Check Device Health**
```java
// Check if device is healthy
StatusCode status = motor.getFaults();
if (status != StatusCode.OK) {
    System.out.println("Device fault: " + status);
}
```

---

## Testing I2C/RS485 Bus

### Step 1: Visual Inspection
1. Follow CAN chain from start to finish.
2. Check all connections.
3. Look for damaged cables.
4. Verify terminator present.
5. Note any issues.

### Step 2: Phoenix Tuner Test
1. Open Phoenix Tuner.
2. Check device list.
3. Verify all devices present.
4. Check for error indicators.
5. Test each device individually.

### Step 3. Utilization Test
1. Enable all devices.
2. Watch CAN utilization.
3. Run robot at full speed.
4. Check utilization stays under 80%.
5. Note any spikes.

### Step 4. Stress Test
1. Run all systems at once.
2. Check for errors.
3. Monitor utilization.
4. Verify all devices respond.
5. Test for 5+ minutes.

---

## Quick Fixes to Try

### Fix 1: Reset I2C/RS485 Bus
1. Disable robot.
2. Power cycle Control Hub.
3. Check all cables.
4. Re-enable robot.

### Fix 2: Reduce Update Rates
```java
// Set all non-critical signals to 4Hz
motor.getSupplyCurrent().setUpdateFrequency(4);
motor.getDeviceTemp().setUpdateFrequency(4);
motor.getFault().setUpdateFrequency(4);
```

### Fix 3. Reconfigure Devices
1. Open Phoenix Tuner.
2. Clear all configs.
3. Reapply configurations.
4. Verify settings saved.

### Fix 4. Check CANivore
```java
// Make sure you specify CANivore if using it
private final TalonFX motor = new TalonFX(1, "CANivore");
```

---

## Prevention Tips

### During Build:
- ✅ **Use quality CAN cables**.
- ✅ **Label each cable with device ID**.
- ✅ **Test each device as you install it**.
- ✅ **Secure cables with zip ties**.
- ✅ **Keep CAN away from power wires**.

### Before Competition:
- ✅ **Test CAN utilization with all systems**.
- ✅ **Verify all devices connected**.
- ✅ **Check firmware up to date**.
- ✅ **Test stress conditions**.
- ✅ **Document I2C bus layout**.

### At Competition:
- ✅ **Have spare CAN cables**.
- ✅ **Bring Phoenix Tuner on laptop**.
- ✅ **Know I2C bus topology**.
- ✅ **Monitor utilization during matches**.
- ✅ **Quick fix plan ready**.

---

## I2C/RS485 Bus Best Practices

### Update Rate Guidelines

**100Hz (fast)**:
- Drivetrain motor positions.
- Drivetrain motor velocities.
- Gyro IMU data
- Critical sensor feedback.

**50Hz (normal)**:
- Mechanism motor positions.
- Mechanism motor velocities.
- Important sensor data.

**10Hz (slow)**:
- Motor temperatures.
- Battery voltage/current.
- Non-critical telemetry.

**4Hz (very slow)**:
- Status signals.
- Fault indicators.
- Diagnostic data.

### Physical Setup Tips

**Good Practices**:
- Keep CAN cables as short as possible.
- Use right-angle connectors in tight spaces.
- Add strain relief to prevent pull-out.
- Label both ends of each cable.
- Test continuity before installing.

**Bad Practices to Avoid**:
- Don''t splice CAN cables.
- Don''t make cables longer than 6 feet.
- Don''t run CAN next to motor power.
- Don''t leave slack cables loose.
- Don''t use different colored cables (confusing)

---

## Monitoring CAN Health

### During Competition
```java
// Add to your robot periodic()
public void robotPeriodic() {
    // Check I2C bus health
    double utilization = PDP.getCANBusUtilization();
    SmartDashboard.putNumber("CAN Utilization", utilization);
    
    if (utilization > 0.8) {
        DriverStation.reportWarning("CAN utilization high: " + utilization, false);
    }
}
```

### Logging CAN Errors
```java
// Log I2C errors for analysis
@Override
public void periodic() {
    StatusCode status = motor.getFault_DeviceID();
    if (status != StatusCode.OK) {
        System.out.println("Motor fault: " + status);
        // Log to file or send telemetry
    }
}
```

---

## Common CAN Device Counts

**Typical robot configurations**:

**Basic Kitbot**:
- 4x Spark MAX/Talon SRX (drivetrain)
- **Total**: 4 devices (easy, one bus fine)

**Competitive Drivetrain**:
- 4x Talon FX (drive motors)
- 4x CANcoder (wheel encoders)  
- 1x Pigeon2 (gyro)
- **Total**: 9 devices (still okay, one bus)

**Full Competition Robot**:
- 4x Talon FX (drivetrain)
- 4x CANcoder (drivetrain)
- 1x Pigeon2 (gyro)
- 2x Talon FX (shooter)
- 2x Talon FX (intake)
- 1x CANcoder (intake sensor)
- **Total**: 14 devices (use CANivore)

---

## When to Get Help

If you''ve tried everything and CAN still doesn''t work:

### Good Help Request:
```
"Having I2C bus communication issues.

Robot setup:
- 4x Talon FX for drivetrain (IDs 1-4)
- 4x CANcoder for wheel sensors (IDs 5-8)
- 1x Pigeon2 gyro (ID 9)
- Connected to Control Hub CAN 0
- 120Ω terminator at end

Symptoms:
- CAN utilization spikes to 95% when driving
- Random "CAN Receive Timeout" errors
- Devices 5-8 sometimes don''t appear in Phoenix Tuner
- Drivetrain motors work, encoders don''t always

What I''ve tried:
- Reduced all non-critical update rates to 4Hz
- Checked all CAN connections (all secure)
- Verified device IDs match code
- Updated firmware on all devices
- Tested with only drivetrain (works fine)
- Tested with encoders only (fails with drivetrain)

Phoenix Tuner shows:
- Utilization: 95% when driving, 20% when idle
- All devices show green when they appear
- Random device dropouts during motion

What should I check next?"
```

---

## Related Guides

- [Motor Configuration](/framework-structure/io-layer)
- [I2C/RS485 Bus Best Practices](/operations/network-configuration)
- [Performance Optimization](/advanced/performance)
- [Electrical Wiring](/operations/checklist)

---

**Remember**: I2C bus is the nervous system of your robot. Keep it healthy and your robot will work reliably!

**Still having CAN issues?** [Ask the community](https://github.com/MARSProgramming/MARSLib/discussions) - describe your setup and symptoms!' WHERE slug = 'troubleshooting-can-bus';

UPDATE docs SET title = 'Untitled', description = '', content = '---
title: "Compilation Errors - Troubleshooting Guide"
description: "Fix common build and compilation errors in MARSLib robot code."
sidebar:
  order: 2
---



Your code won''t build? Don''t worry! Most compilation errors are easy to fix once you know what they mean.

## Quick Check (1 minute)

### 1. What Type of Error?

**Look at the error message:**

- **Red squiggly lines in VS Code**: Syntax error.
- **Gradle build failed**: Compilation error.
- **Runtime error**: Code compiles but crashes when running.
- **Deployment failed**: Code compiles but won''t upload to robot.

This guide covers **compilation errors** (when Gradle build fails).

### 2. Check Gradle Output

```bash
# Run build and see full error
./gradlew build

# Or in VS Code, look at the Gradle tasks output
```

**Look for:**
- ❌ Lines that say "error:" or "failed".
- 📍 Line numbers where errors occur.
- 📝 File names that have problems.

---

## Common Errors and Solutions

### Error 1: "Cannot find symbol"

**What it means:**
Java doesn''t know what you''re talking about. You''re using something that doesn''t exist.

**Example:**
```
Drivetrain.java:15: error: cannot find symbol
        drive.drive(forward, strafe, rotate);
            ^
  symbol:   method drive(double,double,double)
  location: variable drive of type SwerveDrive
```

**Common causes:**
1. **Typo in method name**.
```java
❌ drive.driveForeward(1.0);  // Typo!
✅ drive.drive(1.0, 0, 0);    // Correct
```

2. **Wrong number of arguments**.
```java
❌ drive.drive(1.0);           // Need 3 arguments
✅ drive.drive(1.0, 0, 0);     // Correct
```

3. **Wrong import**.
```java
❌ import com.wpi.first.wpilibj.SwerveDrive;  // Wrong package
✅ import com.marslib.swerve.SwerveDrive;     // Correct
```

4. **Forgot to create object**.
```java
❌ private SwerveDrive drive;     // Never created!
✅ private SwerveDrive drive = new SwerveDrive();  // Created!
```

**Fix:**
1. Check spelling of method names.
2. Verify you have the right number of parameters.
3. Check imports are correct.
4. Make sure objects are created before use.

---

### Error 2: "Package does not exist"

**What it means:**
Java can''t find the library or package you''re trying to use.

**Example:**
```
Drivetrain.java:3: error: package com.marslib.swerve does not exist
import com.marslib.swerve.SwerveDrive;
                           ^
```

**Common causes:**
1. **MARSLib not added to dependencies**.
```gradle
// In build.gradle, make sure you have:
dependencies {
    implementation ''org.team2614:MARSLib:2024.3.0''  // Add this!
}
```

2. **Wrong package name**.
```java
❌ import com.marslib.swervee.SwerveDrive;  // Typo!
✅ import com.marslib.swerve.SwerveDrive;   // Correct
```

3. **Gradle not updated**.
```bash
# Refresh Gradle to get new dependencies
./gradlew --refresh-dependencies build
```

**Fix:**
1. Add MARSLib to build.gradle.
2. Check package name spelling.
3. Run `./gradlew --refresh-dependencies`
4. Restart VS Code if needed.

---

### Error 3: "Incompatible types"

**What it means:**
You''re trying to use the wrong type of data somewhere.

**Example:**
```
DriveCommand.java:25: error: incompatible types: double cannot be converted to String
        String speed = 5.0;
                         ^
```

**Common causes:**
1. **Wrong variable type**.
```java
❌ String speed = 5.0;           // Can''t put double in String
✅ double speed = 5.0;           // Correct type
```

2. **Wrong method return type**.
```java
❌ String position = drivetrain.getPosition();  // Returns double, not String
✅ double position = drivetrain.getPosition();  // Correct type
```

3. **Missing cast**.
```java
❌ double value = integerList.get(0);  // List returns Integer
✅ double value = (double) integerList.get(0);  // Cast it
```

**Fix:**
1. Check variable types match what you assign.
2. Verify method return types.
3. Add type casts if needed.
4. Use correct types for your data.

---

### Error 4: "Method already defined"

**What it means:**
You have two methods with the same name and parameters in the same class.

**Example:**
```
Drivetrain.java:30: error: method drive in class Drivetrain is already defined
    public void drive(double forward, double strafe, double rotate) {
         ^
```

**Common causes:**
1. **Copied method twice**.
```java
public void drive(double forward, double strafe, double rotate) {
    // code here
}

// Oops, pasted it again!
public void drive(double forward, double strafe, double rotate) {
    // same code again
}
```

2. **Forgot to delete old version**.
```java
// Old version
public void drive(double f, double s, double r) { ... }

// New version (rename or delete old one!)
public void drive(double forward, double strafe, double rotate) { ... }
```

**Fix:**
1. Delete duplicate methods.
2. Rename one if they do different things.
3. Keep only the version you want.

---

### Error 5: "Missing return statement"

**What it means:**
You said a method returns something, but it doesn''t always return a value.

**Example:**
```
Shooter.java:15: error: missing return statement
    public double getSpeed() {
           ^
```

**Common causes:**
1. **Forgot return statement**.
```java
❌ public double getSpeed() {
    double speed = calculateSpeed();
    // Forgot: return speed;
}

✅ public double getSpeed() {
    double speed = calculateSpeed();
    return speed;  // Add this!
}
```

2. **Return not in all paths**.
```java
❌ public double getSpeed() {
    if (isReady) {
        return currentSpeed;
    }
    // What if isReady is false? No return!
}

✅ public double getSpeed() {
    if (isReady) {
        return currentSpeed;
    }
    return 0.0;  // Always return something
}
```

**Fix:**
1. Add return statement to method.
2. Make sure all code paths return something.
3. Return default value if needed.

---

### Error 6: "Reached end of file while parsing"

**What it means:**
You have missing closing braces `}` somewhere.

**Example:**
```
RobotContainer.java:50: error: reached end of file while parsing
}
 ^
```

**Common causes:**
1. **Missing closing brace**.
```java
❌ public class RobotContainer {
    public RobotContainer() {
        // Missing closing brace for method
    // Missing closing brace for class!

✅ public class RobotContainer {
    public RobotContainer() {
        // code here
    }  // Close method
}  // Close class
```

2. **Too many opening braces**.
```java
❌ public void myMethod() {
    if (something) {
        while (true) {
            // Where are all the closing braces?

✅ public void myMethod() {
    if (something) {
        while (true) {
            // code here
        }  // Close while
    }  // Close if
}  // Close method
```

**Fix:**
1. Count opening braces `{` and closing braces `}`
2. Make sure they match.
3. Use VS Code''s bracket matching.
4. Indent code to see structure clearly.

---

## Quick Fixes to Try

### Fix 1: Clean and Rebuild
```bash
# Clean build artifacts
./gradlew clean

# Rebuild
./gradlew build
```

### Fix 2: Refresh Gradle
```bash
# Update dependencies
./gradlew --refresh-dependencies

# Rebuild
./gradlew build
```

### Fix 3: Check Java Version
```bash
# Make sure you''re using Java 17
java -version

# Should say: 17.x.x
```

### Fix 4: Restart VS Code
1. Close VS Code.
2. Reopen VS Code.
3. Wait for Gradle to sync.
4. Try building again.

---

## Reading Error Messages

### Anatomy of an Error Message

```
Drivetrain.java:15: error: cannot find symbol
    drive.driveForeward(1.0);
         ^
  symbol:   method driveForeward(double)
  location: variable drive of type SwerveDrive
```

**Breakdown:**
- `Drivetrain.java:15` - File name and line number.
- `error: cannot find symbol` - What went wrong.
- `drive.driveForeward(1.0);` - The problematic code.
- `^` - Points to exact problem location.
- `symbol: method driveForeward(double)` - What Java can''t find.

### Using Line Numbers
1. Go to the file mentioned.
2. Find the line number.
3. Look at code around that line.
4. Check for typos, missing imports, etc.

---

## Prevention Tips

### While Coding:
✅ **Use VS Code autocomplete** - Prevents typos
✅ **Import automatically** - Let VS Code manage imports
✅ **Check for red squiggles** - Fix errors as you type
✅ **Test compile frequently** - Don''t wait until the end

### Before Committing:
✅ **Run full build** - `./gradlew assembleDebug`
✅ **Run tests** - `./gradlew test`
✅ **Check all errors** - Don''t ignore warnings
✅ **Review changes** - Look for accidental edits

---

## When to Get Help

If you can''t fix the error:

### Good Help Request:
```
"I''m getting a compilation error in Drivetrain.java:15

Error message:
''cannot find symbol: method driveForeward(double)''

My code:
drive.driveForeward(1.0);

I''ve tried:
- Checking imports (all look correct)
- Spelling looks right
- SwerveDrive object is created

What am I missing?"
```

### What to Include:
1. **Full error message**.
2. **Code around the error**.
3. **What you''ve tried**.
4. **File and line number**.

---

## Common Mistakes to Avoid

❌ **Don''t**: Ignore errors and keep coding
✅ **Do**: Fix errors as they appear

❌ **Don''t**: Delete code randomly hoping it fixes the error
✅ **Do**: Read the error message carefully

❌ **Don''t**: Copy-paste code without understanding it
✅ **Do**: Learn what the code does

❌ **Don''t**: Give up if you see lots of errors
✅ **Do**: Fix them one at a time (often fixes others!)

---

## Related Guides

- [Build System Guide](/contributing/getting-started)
- [VS Code Setup](/getting-started/vscode)
- [Debugging Tips](/operations/debugging)
- [Common Code Mistakes](/contributing/coding-standards)

---

**Remember**: Everyone encounters compilation errors. The more you see, the better you get at fixing them!

**Still stuck?** [Share your error](https://github.com/MARSProgramming/MARSLib/discussions) and we''ll help you figure it out!' WHERE slug = 'troubleshooting-compilation-errors';

UPDATE docs SET title = 'Untitled', description = '', content = '---
title: "Network Issues - Troubleshooting Guide"
description: "Fix network communication problems, Driver Station App issues, and robot connectivity."
sidebar:
  order: 5
---



Network problems can make your robot uncontrollable or unresponsive. This guide helps you diagnose and fix network issues quickly.

## Quick Check (1 minute)

### <span class="mars-num">1</span> Check Physical Connections

**Look for**:
- Ethernet cable connected to Control Hub.
- Ethernet cable connected to radio.
- Radio powered on (solid orange/green lights)
- Computer connected to robot network.

**What should you see**:
- ✅ **Control Hub**: Orange link light (connected)
- ✅ **Radio**: Solid orange/green lights.
- ✅ **Computer**: Connected to robot-XXXX network.

### <span class="mars-num">2</span> Check Driver Station App

**Look at these indicators**:
- **Communications**: Green (good), Red (bad), Orange (searching)
- **Robot Code**: Green (running), Red (not running)
- **Joysticks**: Shows controller connection status.

**What you want**:
- ✅ **Communications**: Green.
- ✅ **Robot Code**: Green.
- ✅ **Joysticks**: Your controller listed.

### <span class="mars-num">3</span> Check Team Number

**Verify team number matches**:
- Driver Station App team number: XX-XXX.
- Control Hub team number: Same as Driver Station App.
- Radio team number: Same as Driver Station App.

**Mismatch causes**: Connection failures, wrong robot controlled

---

## Common Problems and Solutions

### Problem 1: "Communications Lost" (Red)

**Symptoms**:
- Driver Station App shows "Communications: Red".
- Robot becomes unresponsive.
- Code stops running.
- Can''t drive or control robot.

**Causes**:

**1. Radio Not Powered or Connected**
```
Fix: Check radio power and connections
```

- Check 12V power to radio (from PDP or VRM)
- Verify ethernet cable from Control Hub to radio.
- Check radio lights (should be solid, not blinking)

**2. Wrong Network**
```
Fix: Connect to correct network
```

- Computer should be connected to `robot-XXXX-XX-XXX`
- NOT your home/school WiFi.
- NOT the radio''s setup network (`192.168.XX.X`)

**3. Firewall Blocking**
```
Fix: Temporarily disable firewall
```

- Windows Firewall can block robot communication.
- Disable firewall during competition.
- Add exceptions for FRC programs.

**4. IP Address Conflicts**
```
Fix: Check for duplicate IP addresses
```

- Only one device should have each IP.
- Control Hub: 10.TE.AM.2.
- Radio: 10.TE.AM.1.
- Computer: DHCP from radio.

### Problem 2: "Robot Code" Red (Not Running)

**Symptoms**:
- Driver Station App shows "Robot Code: Red".
- Code deployed but not running.
- Robot does nothing even with comms green.

**Causes**:

**1. Code Crashed on Startup**
```
Fix: Check FTC Dashboard Log for errors
```

- Open FTC Dashboard Log
- Look for red error messages.
- Common crashes: NullPointerException, missing libraries.
- Fix crash and redeploy.

**2. Wrong Main Class**
```
Fix: Verify Main class in build.gradle
```

```gradle
// Should match your main robot class
def mainClassName = "frc.robot.Main"
```

**3. Deployed to Wrong Location**
```
Fix: Ensure code is deployed to Control Hub
```

- Run `adb install -r ...`
- Watch for "BUILD SUCCESSFUL".
- Check FTC Dashboard Log shows "Robot code starting".

### Problem 3: Intermittent Connection Drops

**Symptoms**:
- Robot works, then loses connection randomly.
- Driver Station App shows orange then red.
- Connection comes back after a few seconds.

**Causes**:

**1. Bad Ethernet Cable**
```
Fix: Replace ethernet cable
```

- Try different cable.
- Check for damage.
- Use shielded cable for long runs.

**2. Radio Overheating**
```
Fix: Improve radio ventilation
```

- Radio can overheat in enclosed spaces.
- Add cooling fan.
- Improve airflow around radio.

**3. Power Issues**
```
Fix: Check power connections
```

- Verify 12V power supply is stable.
- Check PDP/VRM connections.
- Measure voltage at radio (should be ~12V)

### Problem 4. Joysticks Not Detected

**Symptoms**:
- Driver Station App shows "Joysticks: None".
- Can''t drive robot.
- Controller doesn''t work.

**Causes**:

**1. USB Controller Disconnected**
```
Fix: Reconnect controller
```

- Unplug and replug controller.
- Try different USB port.
- Replace controller if damaged.

**2. Driver Station App Not Seeing Controller**
```
Fix: Refresh USB devices
```

- Click "USB Devices" tab in Driver Station App.
- Click "Refresh".
- Verify controller appears.

**3. Wrong USB Port**
```
Fix: Use different USB port
```

- Some USB ports don''t work well.
- Try USB 2.0 port, not USB 3.0.
- Try port directly on computer, not hub.

### Problem 5. Can''t Connect to Radio Web Interface

**Symptoms**:
- Can''t access radio configuration page.
- `http://192.168.XX.X` won''t load.
- Can''t configure radio settings.

**Causes**:

**1. Connected to Wrong Network**
```
Fix: Connect to robot network
```

- Must be connected to `robot-XXXX-XX-XXX`
- NOT `192.168.XX.X` (setup network)
- NOT your home network.

**2. Wrong IP Address**
```
Fix: Use correct radio IP
```

- OM5P radio: `http://192.168.XX.X` (XX = team number last 2 digits)
- Old radio: `http://10.TE.AM.1`
- Check radio label for actual IP.

**3. Browser Issues**
```
Fix: Try different browser or clear cache
```

- Try Chrome or Firefox.
- Clear browser cache.
- Try incognito/private mode.

---

## Network Setup Verification

### Step 1: Verify Network Configuration

**Check Control Hub network settings**:
```bash
# In FTC Dashboard Log, check network configuration
# Should show:
# IP: 10.TE.AM.2 (static from radio)
# Netmask: 255.255.255.0
# Gateway: 10.TE.AM.1 (radio)
```

**Check radio configuration**:
```
Login to radio at http://192.168.XX.X
Verify:
- Team number correct
- Bridge mode enabled
- DHCP enabled
```

### Step 2: Test Connectivity

**Ping test**:
```bash
# From computer, ping Control Hub
ping 10.TE.AM.2

# Should get replies
# If "Request timeout", network not working
```

**Trace route**:
```bash
# See where connection fails
tracert 10.TE.AM.2

# Should go: Computer -> Radio -> Control Hub
```

### Step 3: Check NetworkTables Connection

**Verify NetworkTables connected**:
- Open OutlineViewer or SmartDashboard.
- Look for `/SmartDashboard` folder.
- Check that you can add values.
- Verify values appear on both sides.

---

## Competition Network Issues

### Problem: Works at Home, Not at Competition

**Common competition network differences**:

**1. Field Network Interference**
```
Fix: Use provided 5GHz USB WiFi adapter
```

- Competition fields provide WiFi adapter.
- Connect it to Driver Station App computer.
- It''s preconfigured for field network.

**2. Wrong Team Number**
```
Fix: Ensure team number matches competition assignment
```

- Official FRC event team number.
- Must match what you registered with.
- Check FMS for correct number.

**3. Cable Management**
```
Fix: Secure all network cables
```

- Cable management prevents disconnects.
- Use zip ties and strain relief.
- Protect cables from robot movement.

### Problem: FMS (Field Management System) Issues

**Common FMS problems**:

**1. FMS Can''t Connect to Robot**
```
Fix: Check team number, network settings, radio power
```

- Verify team number in Driver Station App.
- Check radio is connected and powered.
- Ensure Control Hub is powered and connected.

**2. DS Errors on FMS**
```
Fix: Check Driver Station App logs
```

- Look for specific error messages.
- Address common errors:
  - "Team number mismatch".
  - "Radio not connected".
  - "Bandwidth too high".

**3. Robot Radio Not Responding**
```
Fix: Power cycle radio and Control Hub
```

- Turn off robot.
- Unplug radio power.
- Wait 10 seconds.
- Reconnect and power back on.

---

## Network Best Practices

### Before Competition

**Setup**:
- ✅ Use high-quality ethernet cables.
- ✅ Label all network cables.
- ✅ Test connection with radio.
- ✅ Practice reconnection quickly.
- ✅ Document network settings.

**Testing**:
- ✅ Test with Driver Station App.
- ✅ Verify all joysticks work.
- ✅ Test connection drops.
- ✅ Practice reconnecting under pressure.

### During Competition

**Monitoring**:
- ✅ Check Communications status.
- ✅ Watch for red indicators.
- ✅ Monitor I2C bus utilization.
- ✅ Note any network issues.

**Quick Recovery**:
- ✅ Have spare ethernet cables.
- ✅ Know how to power cycle quickly.
- ✅ Practice reconnection procedures.
- ✅ Stay calm under pressure.

---

## Quick Fixes

### Fix 1: Power Cycle Robot

1. Disable robot in Driver Station App.
2. Turn off main robot power.
3. Wait 10 seconds.
4. Turn robot back on.
5. Enable in Driver Station App.

### Fix 2: Reconnect Network

1. Unplug ethernet from computer.
2. Wait 5 seconds.
3. Reconnect ethernet.
4. Wait for connection to re-establish.
5. Verify Communications green.

### Fix 3: Restart Driver Station App

1. Close Driver Station App completely.
2. Wait 5 seconds.
3. Reopen Driver Station App.
4. Reconnect joysticks.
5. Enable robot

### Fix 4: Check Radio Configuration

1. Connect to robot network.
2. Login to radio at http://192.168.XX.X.
3. Verify team number.
4. Check bridge mode enabled.
5. Save and reboot radio.

---

## Prevention Tips

### Network Setup

**Do**:
- ✅ Use velcro or zip ties for cables.
- ✅ Label both ends of each cable.
- ✅ Route cables away from sharp edges.
- ✅ Use right-angle connectors where needed.
- ✅ Test connection regularly.

**Don''t**:
- ❌ Run cables near motor power wires.
- ❌ Leave cables loose to vibrate out.
- ❌ Use damaged cables.
- ❌ Ignore intermittent connection issues.
- ❌ Forget to test before competition.

### Competition Preparation

**Essential Items**:
- Spare ethernet cables (2-3)
- USB WiFi adapter (provided at event)
- Network configuration sheet.
- Contact info for FTAs (Field Technical Advisors)
- Backup plan for network failures.

---

## Diagnostic Commands

### Windows Network Diagnostics

```bash
# Check network connection
ping 10.TE.AM.2

# Trace route to robot
tracert 10.TE.AM.2

# Check DNS resolution
nslookup robot-XXXX-XX-XXX.local

# Check network interfaces
ipconfig
```

### Linux/Mac Network Diagnostics

```bash
# Check network connection
ping 10.TE.AM.2

# Trace route to robot
traceroute 10.TE.AM.2

# Check network interfaces
ifconfig

# Check routing table
netstat -rn
```

---

## Advanced Troubleshooting

### Capture Network Traffic

**Use Wireshark to analyze network issues**:
```bash
# Install Wireshark
# Start capture on robot network interface
# Filter for:
# - DNS traffic
# - NetworkTables updates
# - Disconnection events
```

### Monitor NetworkTables

**Check for NetworkTables spam**:
```java
// Add to robotInit()
NetworkTableInstance.getDefault().addEntryListener(event -> {
    System.out.println("NT update: " + event.key.getFullName());
});
```

**What to look for**:
- Updates every 20ms = OK (periodic)
- Updates every 1ms = Too frequent (problem!)
- No updates = Connection issue.

---

## When to Get Help

### At Competition

**Field Technical Assistant (FTA)**:
- Ask FTA for help with field network.
- They can diagnose FMS issues.
- They have tools to check field network.

**Robot Inspector**:
- Can help with basic network setup.
- Can check team number configuration.
- Can verify robot connections.

### Never Alone

**Network issues are common**:
- Every team experiences them.
- FTAs are there to help.
- Other teams can assist.
- Don''t panic, work systematically.

---

## Network Checklist

### Before Leaving for Competition

- [ ] Ethernet cables tested and labeled.
- [ ] Radio configured with correct team number.
- [ ] Driver Station App team number set.
- [ ] All joystools tested.
- [ ] Connection tested with robot.
- [ ] Spare cables packed.
- [ ] Network configuration printed.

### At Competition

- [ ] Connect to field WiFi adapter.
- [ ] Verify team number in Driver Station App.
- [ ] Test connection to robot.
- [ ] Test all joysticks.
- [ ] Run through robot inspection.
- [ ] Practice reconnection procedures.

---

## Related Guides

- [I2C/RS485 Bus Issues](/troubleshooting/can-bus)
- [Driver Station App Setup](/operations/network-configuration)
- [Radio Configuration](/operations/network-configuration)
- [Competition Prep](/competition/preparation)

---

**Remember**: Good network practices prevent most issues. Test regularly and have backup plans for competition!

**Still having network issues?** [Ask the community](https://github.com/MARSProgramming/MARSLib/discussions) - describe your setup and symptoms!' WHERE slug = 'troubleshooting-network-issues';

UPDATE docs SET title = 'Untitled', description = '', content = '---
title: "Robot Won''t Move - Troubleshooting Guide"
description: "Step-by-step checklist to diagnose and fix why your robot won''t move."
sidebar:
  order: 1
---



Every technical hurdle is an opportunity for **Discovery**. If your robot isn''t moving as expected, don''t panic—this is where your team''s **Innovation** and **Teamwork** shine. Follow this checklist to systematically diagnose the issue, turning a stressful moment into a **Fun** learning experience and ensuring your robot makes its next high-**Impact** appearance on the field.

## Quick Check (30 seconds)

### 1. Is Robot Code Running?
- Look at the Driver Station App.
- Is "Robot Code" showing **GREEN**?
  - ❌ **RED/YELLOW**: Code isn''t running.
  - ✅ **GREEN**: Code is running, skip to Step 2.

**If not green:**
1. Check for errors in FTC Dashboard Log.
2. Reboot the Control Hub.
3. Restart the Driver Station App.
4. Redeploy code if needed.

### 2. Is Robot Enabled?
- Look at Driver Station App mode.
- Are you in **Teleop**, **Auto**, or **Test** mode?
- Is the **ENABLE** button pressed?

**If disabled:**
1. Click the mode you want (usually Teleop)
2. Click the ENABLE button.
3. Robot should move now.

### 3. Is Controller Connected?
- Look at Driver Station App USB tab.
- Do you see your controller?
- Are the lights on the controller on?

**If not connected:**
1. Unplug and replug controller.
2. Try different USB port.
3. Replace controller batteries.
4. Try different controller.

---

## Detailed Diagnosis (5 minutes)

If quick check didn''t fix it, work through these steps:

### Step 1: Check Joystick Input (1 minute)

**Print joystick values to see if they''re being read:**

```java
@Override
public void execute() {
    double forward = -controller.getLeftY();
    double strafe = controller.getLeftX();
    double rotate = controller.getRightX();
    
    // Add this to debug
    System.out.println("Joystick: F=" + forward + " S=" + strafe + " R=" + rotate);
    
    drivetrain.drive(forward, strafe, rotate);
}
```

**What to look for:**
- ✅ **Values changing**: Joystick works, problem is elsewhere.
- ❌ **Always zero**: Joystick not being read.
- ❌ **No output**: Command isn''t running.

### Step 2: Verify Command is Running (1 minute)

**Add debug print to see if command runs:**

```java
public DriveCommand(Drivetrain drivetrain, Gamepad controller) {
    this.drivetrain = drivetrain;
    this.controller = controller;
    addRequirements(drivetrain);
    System.out.println("DriveCommand created!");  // Add this
}

@Override
public void execute() {
    System.out.println("DriveCommand executing!");  // Add this
    // ... rest of code
}
```

**What to look for:**
- ✅ **"executing!" prints every 20ms**: Command is running.
- ❌ **Only "created!" once**: Command not scheduled.
- ❌ **No output at all**: Command not being created.

### Step 3: Check Default Command (1 minute)

**Make sure drivetrain has a default command:**

```java
public RobotContainer() {
    // In RobotContainer.java
    drivetrain.setDefaultCommand(
        new DriveCommand(drivetrain, driver)
    );
}
```

**Verify it''s set:**
1. Add print to RobotContainer constructor.
2. Look for "DriveCommand created!" in FTC Dashboard Log.
3. Check that default command is actually set.

### Step 4: Check Subsystem (1 minute)

**Add debug to subsystem:**

```java
public void drive(double forward, double strafe, double rotate) {
    System.out.println("Drive called: " + forward + ", " + strafe + ", " + rotate);
    drive.drive(forward, strafe, rotate);
}
```

**What to look for:**
- ✅ **"Drive called!" prints**: Subsystem receiving commands.
- ❌ **No output**: Subsystem not being called.

### Step 5: Check Motor Configuration (2 minutes)

**Verify motors are configured correctly:**

```java
// Check in your subsystem constructor
public Drivetrain() {
    // Add debug to verify motors are created
    System.out.println("Creating drivetrain...");
    drive = new SwerveDrive();
    System.out.println("Drivetrain created!");
}
```

**Check motor hardware:**
1. Look for I2C errors in FTC Dashboard Log.
2. Verify motor IDs are correct.
3. Check that motors are getting power.
4. Try one motor at a time.

---

## Common Problems and Solutions

### Problem 1: Wrong Controller Port

**Symptoms:**
- Joystick values don''t change.
- "DriveCommand executing!" but values are zero.

**Solution:**
```java
// Try different port numbers
private final Gamepad driver = new Gamepad(0);  // Try 1, 2, 3
```

### Problem 2: Deadband Too Large

**Symptoms:**
- Robot moves only when joystick is at max.
- Small movements don''t work.

**Solution:**
```java
// Reduce or remove deadband
double forward = -controller.getLeftY();
if (Math.abs(forward) < 0.1) forward = 0;  // Reduce from 0.2 to 0.1
```

### Problem 3: Command Not Scheduled

**Symptoms:**
- "DriveCommand created!" but never "executing!".
- Command runs once then stops.

**Solution:**
```java
// Make sure it''s set as DEFAULT command
drivetrain.setDefaultCommand(new DriveCommand(drivetrain, driver));

// NOT scheduled with .schedule()
// new DriveCommand(drivetrain, driver).schedule();  // Wrong way
```

### Problem 4: Subsystem Requirements Wrong

**Symptoms:**
- Command creates but doesn''t execute.
- Other commands prevent this one from running.

**Solution:**
```java
public DriveCommand(Drivetrain drivetrain, Gamepad controller) {
    this.drivetrain = drivetrain;
    this.controller = controller;
    addRequirements(drivetrain);  // MUST have this!
}
```

### Problem 5: Motors Not Connected

**Symptoms:**
- Everything looks good in code.
- Motors show in FTC Dashboard Log but don''t move.
- No I2C errors

**Solution:**
1. Check motor power cables.
2. Verify motor controllers have power.
3. Check motor breakers (if applicable)
4. Try swapping motor controllers.

### Problem 6: Simulation vs Real Robot

**Symptoms:**
- Works in simulation but not real robot.
- Code runs but no movement.

**Solution:**
```java
// Check you''re using REAL IO, not SIM IO
public Drivetrain() {
    // Make sure you''re not creating IOSim by accident
    drive = new SwerveDrive();
}
```

---

## Quick Fixes to Try

### Fix 1: Reboot Everything
1. Disable robot.
2. Reboot Control Hub.
3. Restart Driver Station App.
4. Re-enable robot.

### Fix 2: Redeploy Code
1. Stop code
2. Build project: `./gradlew assembleDebug`
3. Deploy: `adb install -r ...`
4. Re-enable robot.

### Fix 3: Check Update Speed
```java
// Make sure signals are updating
motor.setPosition(0).setUpdateFrequency(100);  // 100Hz
```

### Fix 4: Verify I2C/RS485 Bus
1. Check REV Hardware Client shows motors.
2. Look for I2C errors in FTC Dashboard Log.
3. Verify I2C bus is connected.

---

## When to Get Help

If you''ve tried everything above:

### What to Tell Us:
1. **What you see**: FTC Dashboard Log output, Driver Station App status.
2. **What you tried**: Which fixes you attempted.
3. **What happens**: Exact symptoms (what does/doesn''t work)
4. **Code snippet**: Relevant parts of your code.

### Good Help Request:
```
"My swerve drive won''t move. I''ve verified:
- Robot code is running (green on Driver Station App)
- Joystick values are printing (F=0.5, S=0.0, R=0.0)
- Command is executing (prints every 20ms)
- Subsystem drive() is being called
- Motors show in Phoenix but don''t move

No I2C errors in FTC Dashboard Log. All motor IDs are correct.
What should I check next?"
```

---

## Prevention Tips

### Before Competition:
- ✅ Test all subsystems individually.
- ✅ Verify each motor works.
- ✅ Check all joystick mappings.
- ✅ Document controller ports.

### During Competition:
- ✅ Keep this checklist handy.
- ✅ Have spare controllers ready.
- ✅ Know motor IDs and I2C bus layout.
- ✅ Practice quick diagnosis.

### After Fix:
- ✅ Document what was wrong.
- ✅ Add check to prevent future issues.
- ✅ Tell team members what to watch for.

---

## Related Guides

- [Motor Configuration Guide](/framework-structure/io-layer)
- [Controller Input Guide](/reference/controller-mappings)
- [I2C/RS485 Bus Troubleshooting](/troubleshooting/can-bus)
- [General Debugging Tips](/operations/debugging)

---

**Still stuck?** [Ask the community](https://github.com/MARSProgramming/MARSLib/discussions) - we''re here to help!' WHERE slug = 'troubleshooting-robot-wont-move';

UPDATE docs SET title = 'Untitled', description = '', content = '---
title: "Simulation Troubleshooting"
description: "Fix common simulation problems and test your robot code without hardware."
sidebar:
  order: 6
---



Can''t test your robot code in simulation? This guide helps you fix common simulation problems quickly.

---

## Quick Test: Is Simulation Working?

**Run this command**:
```bash
# In VS Code terminal
./gradlew simulateJava
```

**What should happen**:
- Robot simulation window opens.
- SimGUI shows field.
- Robot appears on field.
- No red error messages.

**If you see errors**: Follow the troubleshooting steps below.

---

## Problem: Simulation Won''t Start

### Symptom: "Command failed" or "Build failed"

**Quick fixes to try**:

**1. Check Java version**:
```bash
java -version
```

You should see: Java 17 or 21
- If not, install correct Java version.
- Update JAVA_HOME environment variable.

**2. Clean and rebuild**:
```bash
./gradlew clean
./gradlew build
./gradlew simulateJava
```

**3. Check Gradle wrapper**:
```bash
./gradlew --version
```

Should show Gradle 8.x or higher
- If not, reimport Gradle project in VS Code.

---

### Symptom: "Class not found" errors

**The problem**: Java can''t find your classes

**Quick fixes**:

**1. Check package names**:
```java
// Wrong: File is in src/main/java/frc/robot
package com.example.robot;  // Wrong package!

// Right: 
package frc.robot;  // Matches directory!
```

**2. Check imports**:
```java
// Make sure you import what you use
import frc.robot.subsystems.Drivetrain;
import frc.robot.commands.ExampleCommand;
```

**3. Rebuild project**:
```bash
./gradlew clean build
```

---

### Symptom: "NoSuchMethodError"

**The problem**: Method doesn''t exist or signature doesn''t match

**Quick fixes**:

**1. Check method signature**:
```java
// Calling code
drivetrain.drive(1.0, 0.5);  // 2 arguments

// Method signature
public void drive(double speed) { ... }  // Only 1 argument!

// Fix: Make signatures match
public void drive(double speed, double rotation) { ... }
```

**2. Check FTC SDK version**:
```gradle
// In build.gradle
dependencies {
    implementation "edu.wpi.first.wpilibj:wpilibj-java:2024.+"  // Make sure versions match
}
```

---

## Problem: Simulation Crashes

### Symptom: Simulation window opens, then crashes

**Common causes and fixes**:

**1. Graphics driver issues**:

**Windows**: Update graphics drivers
```bash
# Check for Windows updates
# Or visit NVIDIA/AMD website for latest drivers
```

**Linux**: Install required packages
```bash
sudo apt-get update
sudo apt-get install libgl1-mesa-glx libxext-dev libxrender-dev libxtst-dev libxrandr-dev
```

**macOS**: Update macOS and XQuartz

**2. Memory issues**:

**Increase Gradle memory**:
```gradle
// In gradle.properties
org.gradle.jvmargs=-Xmx4096m  // Increase from default
```

**3. Null pointer exceptions**:

**Check for uninitialized objects**:
```java
// Wrong:
private Drivetrain drivetrain;

public Robot() {
    drivetrain.drive(0, 0, 0);  // Crashes! drivetrain is null
}

// Right:
private final Drivetrain drivetrain = new Drivetrain();

public Robot() {
    // Now this works!
}
```

---

## Problem: Robot Doesn''t Move in Simulation

### Symptom: Simulation runs, but robot stays still

**Debug steps**:

**1. Check if commands are scheduled**:
```java
@Override
public void execute() {
    System.out.println("Command running!");  // Check console
    drivetrain.drive(x, y, rot);
}
```

If you don''t see "Command running!", command isn''t scheduled.

**2. Check subsystem periodic**:
```java
@Override
public void periodic() {
    System.out.println("Drivetrain periodic: " + speed);
    motor.set(speed);
}
```

If you don''t see this, subsystem isn''t running.

**3. Check simulation initialization**:
```java
// In Drivetrain subsystem
public Drivetrain() {
    // For simulation, you MUST use simulation IO
    if (RobotBase.isSimulation()) {
        gyroIO = new GyroIOSim();  // Simulation IO
    } else {
        gyroIO = new GyroIOTalonFX();  // Real hardware
    }
}
```

---

## Problem: Simulation behaves differently than real robot

### Symptom: "It works in sim but not on real robot!"

**Common causes**:

**1. Physics not realistic enough**:

**Adjust simulation physics**:
```java
// In simulation IO
@Override
public void periodic() {
    // Add realistic delays
    velocity = velocity * 0.95 + targetVelocity * 0.05;
    
    // Add noise
    velocity += (Math.random() - 0.5) * 0.01;
}
```

**2. Timing differences**:

**Simulation runs faster than real time!**
```java
// Don''t assume real-time
@Override
public void periodic() {
    double now = Timer.getFPGATimestamp();
    double dt = now - lastTime;
    lastTime = now;
    
    // Use dt for calculations
    position += velocity * dt;
}
```

**3. Hardware differences**:

**Real hardware has delays sim doesn''t**:
```java
// Add artificial delay in sim
public void setVelocity(double velocity) {
    if (RobotBase.isSimulation()) {
        // Simulate I2C bus delay
        Timer.delay(0.01);  // 10ms delay
    }
    motor.setVelocity(velocity);
}
```

---

## Problem: Field visualization doesn''t work

### Symptom: SimGUI shows field but no robot

**Quick fixes**:

**1. Check if pose is being published**:
```java
// In Drivetrain subsystem
@Override
public void periodic() {
    // Send pose to dashboard
    SmartDashboard.putData("Robot", field.getObject("robot"));
    field.getObject("robot").setPose(pose);
}
```

**2. Check field object name**:
```java
// In SimGUI
// Make sure field object name matches code!
field.getObject("robot")  // Must match this name!
```

**3. Send pose to NetworkTables**:
```java
// In periodic()
SmartDashboard.putNumber("PoseX", pose.getX());
SmartDashboard.putNumber("PoseY", pose.getY());
SmartDashboard.putNumber("PoseTheta", pose.getRotation().getDegrees());
```

---

## Problem: Joysticks don''t work in simulation

### Symptom: Joystick input does nothing

**Quick fixes**:

**1. Check if joystick is connected**:
```java
@Override
public void periodic() {
    double x = joystick.getX();
    double y = joystick.getY();
    
    SmartDashboard.putNumber("JoystickX", x);  // Check dashboard
    SmartDashboard.putNumber("JoystickY", y);
}
```

If values stay at 0, joystick not detected.

**2. Check joystick port**:
```java
// Make sure port matches joystick selection
private final Gamepad driver = new Gamepad(0);  // Port 0

// Or check all ports:
for (int i = 0; i < 6; i++) {
    Gamepad test = new Gamepad(i);
    if (test.getAButton()) {
        System.out.println("Joystick on port " + i);
    }
}
```

**3. Use keyboard in simulation**:
```java
// Add keyboard controls for simulation
@Override
public void periodic() {
    double x = 0;
    double y = 0;
    
    if (DriverStation.isSimulation()) {
        // Keyboard controls
        if (Keyboard.isKeyDown(Key.W)) y = -1;
        if (Keyboard.isKeyDown(Key.S)) y = 1;
        if (Keyboard.isKeyDown(Key.A)) x = -1;
        if (Keyboard.isKeyDown(Key.D)) x = 1;
    } else {
        // Real joystick
        x = joystick.getX();
        y = joystick.getY();
    }
    
    drivetrain.drive(x, y, 0);
}
```

---

## Problem: Simulation is too slow

### Symptom: Simulation lags or stutters

**Quick fixes**:

**1. Reduce physics complexity**:
```java
// Don''t update physics too fast
@Override
public void periodic() {
    if (Timer.getFPGATimestamp() - lastPhysicsUpdate > 0.02) {
        updatePhysics();
        lastPhysicsUpdate = Timer.getFPGATimestamp();
    }
}
```

**2. Reduce logging**:
```java
// Don''t log every iteration
private double lastLogTime = 0;

@Override
public void periodic() {
    double now = Timer.getFPGATimestamp();
    
    // Only log every 1 second
    if (now - lastLogTime > 1.0) {
        System.out.println("Pose: " + pose);
        lastLogTime = now;
    }
}
```

**3. Close unnecessary programs**:
- Close web browsers.
- Close other IDE windows.
- Check CPU usage in Task Manager.

---

## Problem: Units don''t match

### Symptom: "Robot moves wrong distance in sim"

**The problem**: Units confusion!

**Common unit mistakes**:

```java
// WRONG: Mixing units
double velocityMetersPerSecond = motor.getVelocity();  // Returns RPM!

// RIGHT: Convert units
double velocityRPM = motor.getVelocity();
double velocityMetersPerSecond = Units.RotationsPerMinute.toRadiansPerSecond(velocityRPM) * wheelRadius;
```

**Use FTC SDK Units class**:
```java
import edu.wpi.first.units.Units;

// Convert anything!
double meters = Units.Inches.of(24).in(Units.Meters);  // 24 inches to meters
double rpm = Units.MetersPerSecond.of(5).in(Units.RotationsPerMinute);  // m/s to RPM
```

---

## Advanced: Writing Simulation Tests

### Unit Tests for Simulation

**Test your simulation IO**:
```java
@Test
public void testDrivetrainSimulation() {
    // Create simulation
    Drivetrain drivetrain = new Drivetrain();
    
    // Simulate for 5 seconds
    for (int i = 0; i < 250; i++) {  // 250 * 20ms = 5 seconds
        drivetrain.drive(1.0, 0, 0);  // Drive forward
        drivetrain.periodic();
        Timer.delay(0.02);
    }
    
    // Check robot moved forward
    assertTrue(drivetrain.getPose().getX() > 1.0, "Robot should move forward");
}
```

**Test vision in simulation**:
```java
@Test
public void testVisionInSimulation() {
    VisionSubsystem vision = new VisionSubsystem();
    
    // Simulate AprilTag detection
    vision.simulateDetectedTag(new AprilTag(1, new Pose3d(5, 0, 0, new Rotation3d())));
    
    vision.periodic();
    
    // Check target detected
    assertTrue(vision.hasTarget(), "Should detect AprilTag");
    assertEquals(5.0, vision.getTargetDistance(), 0.1, "Target at 5 meters");
}
```

---

## Simulation Best Practices

### Do''s and Don''ts

**DO**:
- ✅ Test everything in simulation first.
- ✅ Use simulation IO classes.
- ✅ Add debug prints.
- ✅ Test edge cases.
- ✅ Write simulation tests.

**DON''T**:
- ❌ Assume simulation = real world.
- ❌ Ignore simulation warnings.
- ❌ Skip simulation testing.
- ❌ Test only on real robot.
- ❌ Assume perfect physics.

---

## Quick Simulation Checklist

**Before testing in simulation**:
- [ ] Java version correct (17 or 21)
- [ ] Project builds successfully.
- [ ] Simulation IO classes implemented.
- [ ] All imports correct.
- [ ] No compilation errors.

**When simulation runs**:
- [ ] Robot appears on field.
- [ ] Robot responds to joystick.
- [ ] Console shows no errors.
- [ ] Dashboard shows data.
- [ ] Commands execute correctly.

**Before testing on real robot**:
- [ ] Everything works in simulation.
- [ ] Simulation tests pass.
- [ ] Code reviewed by teammate.
- [ ] Safety check: Can''t move unexpectedly.

---

## Common Simulation Commands

```bash
# Run simulation
./gradlew simulateJava

# Run specific simulation test
./gradlew simulateJavaTest --tests DrivetrainSimulationTest

# Clean and rebuild
./gradlew clean build simulateJava

# Run with more memory
./gradlew simulateJava -Dorg.gradle.jvmargs="-Xmx4096m"

# Run simulation in debug mode
./gradlew simulateJava --debug-jvm
```

---

## Getting Help with Simulation

**When simulation problems persist**:

**Gather this information**:
1. What command did you run?
2. What error message appeared?
3. What did you expect to happen?
4. What actually happened?
5. Your OS and Java version.

**Where to get help**:
- [FRC Discord #programming](https://discord.gg/frc)
- [Chief Delphi](https://www.chiefdelphi.com)
- [MARSLib Discussions](https://github.com/MARSProgramming/MARSLib/discussions)

**Include**:
- Error messages (full text)
- Code snippets (relevant parts)
- Screenshots (if helpful)

---

## Next Steps

**Once simulation works**:
- [Test all subsystems](/contributing/testing-guide)
- [Write auto tests](/contributing/testing-guide)
- [Practice autonomous](/contributing/testing-guide)
- [Prepare for real robot](/operations/checklist)

---

**Remember**: Good simulation testing saves hours of debugging on real robot!

**Still stuck?** [Share your simulation problem](https://github.com/MARSProgramming/MARSLib/discussions) - we''ll help you figure it out!
' WHERE slug = 'troubleshooting-simulation-issues';

UPDATE docs SET title = 'Untitled', description = '', content = '---
title: "Vision Systems - Troubleshooting Guide"
description: "Fix common vision system problems with cameras, AprilTags, and object detection."
sidebar:
  order: 3
---



Your vision system should help your robot see and track targets. When it doesn''t work, use this guide to fix it fast.

## Quick Check (1 minute)

### 1. Is the Camera Connected?

**Check physically**:
- Is camera plugged into the robot?
- Is the power cable connected?
- Is the network cable secure?

**Check in software**:
- Open the camera''s web interface (usually `http://10.XX.YY.Z:5800`)
- Can you see the camera feed?
- Is the camera showing up in Network Tables?

### 2. Is the Vision Pipeline Running?

**Check your vision software** (Limelight, PhotonVision, etc.):
- Is the software running?
- Is the correct pipeline selected?
- Are there any error messages?

**Check Network Tables**:
- Open OutlineViewer or SmartDashboard.
- Look for vision data (usually under `/vision` or `/limelight`)
- Do you see target data updating?

### 3. Is Your Code Reading Vision Data?

**Add debug output**:
```java
@Override
public void periodic() {
    var pose = vision.getPoseEstimate();
    System.out.println("Vision pose: " + pose);  // Debug print
    
    if (pose.isPresent()) {
        System.out.println("Target at: " + pose.get());
    } else {
        System.out.println("No target visible");
    }
}
```

**What to look for**:
- ✅ **"Target at:"**: Camera sees target, code is working.
- ❌ **"No target visible"**: Camera doesn''t see target OR code not reading data.
- ❌ **No output at all**: Vision IO not being called.

---

## Common Problems and Solutions

### Problem 1: Camera Shows "No Target" When Target is There

**Symptoms**:
- Camera feed shows target clearly.
- Vision software reports "No target".
- Network Tables show no valid targets.

**Causes**:

**1. Pipeline Not Configured Correctly**
```
Fix: Adjust pipeline settings
```

**For AprilTags (Limelight)**:
1. Open Limelight web interface.
2. Go to Pipeline tab.
3. Set Pipeline Type to "AprilTag".
4. Set AprilTag family to your game tags (36h11, 16h5, etc.)
5. Set resolution to "640x480" or higher.
6. Save and apply.

**For Retroreflective Targets**:
1. Check exposure: Too high = washed out, too low = can''t see.
2. Adjust threshold: Make sure only target is highlighted.
3. Check contour filtering: Min area should be 0.1-1.0% of image.

**2. Wrong Target Type Selected**
```
Fix: Match pipeline to actual targets
```

- **AprilTags**: Use AprilTag pipeline.
- **Retroreflective**: Use Reflective pipeline  .
- **Colored objects**: Use color-specific pipeline.

**3. Camera Exposure Wrong**
```
Fix: Adjust exposure
```

**AprilTags**:
- Keep exposure moderate (30-50)
- Avoid direct sunlight on camera.

**Retroreflective**:
- Lower exposure (5-15)
- Use ring light if needed.

---

### Problem 2: Vision Pose Jumps Around

**Symptoms**:
- Target position changes drastically frame to frame.
- Robot gets confused by vision updates.
- Pose estimate is unstable.

**Causes**:

**1. Multiple Targets Visible**
```
Fix: Filter to specific target IDs
```

```java
// Only use specific AprilTag
public Optional<Pose2d> getPoseEstimate() {
    var result = camera.getLatestResult();
    
    if (result.hasTargets()) {
        // Filter to specific tag IDs
        for (Phototarget target : result.getTargets()) {
            if (target.getFiducialId() == 4 || target.getFiducialId() == 7) {
                return Optional.of(target.getCameraRelativePose());
            }
        }
    }
    
    return Optional.empty();
}
```

**2. Not Averaging Results**
```
Fix: Use multiple readings
```

```java
// Average last N readings
private final Queue<Pose2d> poseHistory = new LinkedList<>();
private static final int HISTORY_SIZE = 5;

public Optional<Pose2d> getFilteredPose() {
    if (poseHistory.size() < HISTORY_SIZE) {
        return Optional.empty();
    }
    
    // Calculate average pose
    double avgX = 0, avgY = 0, avgRotation = 0;
    for (Pose2d pose : poseHistory) {
        avgX += pose.getX();
        avgY += pose.getY();
        avgRotation += pose.getRotation().getRadians();
    }
    
    return Optional.of(new Pose2d(
        avgX / HISTORY_SIZE,
        avgY / HISTORY_SIZE,
        Rotation2d.fromRadians(avgRotation / HISTORY_SIZE)
    ));
}
```

**3. Target Too Far Away**
```
Fix: Only use vision when close enough
```

```java
// Ignore distant targets
public Optional<Pose2d> getPoseEstimate() {
    var result = camera.getLatestResult();
    
    if (result.hasTargets()) {
        Phototarget best = result.getBestTarget();
        double distance = best.getCameraRelativePose().getTranslation().getNorm();
        
        // Only use targets within 3 meters
        if (distance < 3.0) {
            return Optional.of(best.getCameraRelativePose());
        }
    }
    
    return Optional.empty();
}
```

---

### Problem 3: Vision Results Are Always Wrong

**Symptoms**:
- Vision reports targets in wrong locations.
- Distance/angle measurements are off.
- Robot drives to wrong positions.

**Causes**:

**1. Camera Calibration Wrong**
```
Fix: Recalibrate camera
```

**Intrinsic calibration** (camera properties):
1. Print calibration checkerboard.
2. Take 20+ pictures at different angles/distances.
3. Run calibration tool (OpenCV, ROS, or vendor tools)
4. Update camera intrinsics in vision software.

**Extrinsic calibration** (camera mounting):
1. Measure camera position relative to robot center.
2. Measure camera angle (pitch, yaw, roll)
3. Update in vision software or code.

**2. Camera Mount Moved**
```
Fix: Re-measure camera position
```

```java
// Camera is 0.2m forward, 0.1m left, 0.3m up from robot center
// Camera is angled 15 degrees down
private final Transform3d robotToCamera = new Transform3d(
    new Translation3d(0.2, 0.1, 0.3),  // Position
    new Rotation3d(0, -Units.degreesToRadians(15), 0)  // Angle (pitch down)
);
```

**3. Wrong AprilTag Field Layout**
```
Fix: Update field layout
```

```java
// Make sure you''re using correct year''s field layout
AprilTagFieldLayout fieldLayout = AprilTagFieldLayout.loadField(
    AprilTagFieldLayout.k2024CrescendoResource  // Use current year!
);
```

---

### Problem 4: Vision Causes Robot to Shake

**Symptoms**:
- Robot vibrates when using vision.
- Drivetrain motors oscillate.
- Vision commands make robot unstable.

**Causes**:

**1. Vision Updates Too Fast**
```
Fix: Limit vision update rate
```

```java
// Only accept vision updates at 20Hz
private double lastVisionUpdateTime = 0;

public void addVisionMeasurement(Pose2d visionPose, double timestamp) {
    if (timestamp - lastVisionUpdateTime > 0.05) {  // 50ms = 20Hz
        drivetrain.addVisionMeasurement(visionPose, timestamp);
        lastVisionUpdateTime = timestamp;
    }
}
```

**2. Vision Not Compatible with Odometry**
```
Fix: Check vision rejection logic
```

```java
// Only use vision if it''s close to odometry estimate
public Optional<Pose2d> getPoseEstimate() {
    var visionPose = getRawVisionPose();
    var odomPose = drivetrain.getPose();
    
    if (visionPose.isPresent()) {
        double distance = visionPose.get().getTranslation().getDistance(
            odomPose.getTranslation()
        );
        
        // Only use if vision is within 0.5m of odometry
        if (distance < 0.5) {
            return visionPose;
        }
    }
    
    return Optional.empty();
}
```

**3. PID Gains Too High with Vision**
```
Fix: Use different gains for vision-based control
```

```java
// Use more conservative gains when using vision
private final PIDController visionTurnController = new PIDController(2.0, 0, 0.1);
private final PIDController odomTurnController = new PIDController(4.0, 0, 0.5);

@Override
public void execute() {
    PIDController controller = usingVision ? visionTurnController : odomTurnController;
    double output = controller.calculate(currentHeading, targetHeading);
    // ...
}
```

---

### Problem 5: Vision Works in Practice But Not Competition

**Symptoms**:
- Vision works perfectly at home.
- Same vision setup fails at competition.
- Can''t figure out what changed.

**Competition-Specific Issues**:

**1. Field Lighting Different**
```
Fix: Adjust pipeline for competition lighting
```

- Competition arenas often have different lighting.
- Adjust exposure/threshold settings.
- Test at venue if possible.

**2. Field AprilTag Positions Wrong**
```
Fix: Verify field layout
```

- Double-check you have correct year''s field.
- Some venues have slightly different tag positions.
- Ask field supervisor if unsure.

**3. Network Issues**
```
Fix: Check camera connectivity
```

- Camera might be on different subnet.
- Firewall might block vision traffic.
- Verify camera IP address.

**4. Driver Station App Camera Blocking Vision**
```
Fix: Coordinate with other teams
```

- Other teams'' cameras might interfere.
- Use unique camera IDs/frequencies.
- Check for radio interference.

---

## Testing Vision System

### Step 1: Verify Camera Feed
1. Open camera web interface.
2. Check image quality.
3. Verify you can see targets.
4. Note any issues (glare, blur, etc.)

### Step 2: Test Pipeline
1. Point camera at target.
2. Check if pipeline detects target.
3. Verify distance/angle measurements.
4. Test at different distances and angles.

### Step 3: Test Integration
1. Add debug output to your code.
2. Verify vision data reaches your code.
3. Check pose estimation looks reasonable.
4. Test vision-based commands.

### Step 4: Full System Test
1. Run autonomous routine using vision.
2. Verify robot behaves correctly.
3. Test at different positions.
4. Check for edge cases.

---

## Quick Fixes to Try

### Fix 1: Reset Vision Pipeline
1. Stop vision software.
2. Power cycle camera.
3. Restart vision software.
4. Reload pipeline settings.

### Fix 2: Recalibrate Camera
1. Print calibration target.
2. Run calibration routine.
3. Update camera intrinsics.
4. Test accuracy.

### Fix 3: Simplify Pipeline
1. Switch to basic pipeline.
2. Disable advanced features.
3. Test if basic detection works.
4. Add complexity back gradually.

### Fix 4: Check Network Tables
1. Open OutlineViewer.
2. Browse to vision folder.
3. Verify data is updating.
4. Check for errors/warnings.

---

## Prevention Tips

### Before Competition:
- ✅ **Test** vision at multiple distances.
- ✅ **Test** with different lighting conditions.
- ✅ **Calibrate** camera properly.
- ✅ **Document** all settings.
- ✅ **Practice** troubleshooting vision issues.

### During Competition:
- ✅ **Test** vision on practice field if available.
- ✅ **Check** camera mounting is secure.
- ✅ **Verify** lighting conditions.
- ✅ **Have backup** (odometry-only auto)
- ✅ **Document** any issues for future matches.

---

## Vision-Specific Troubleshooting

### Limelight Issues

**Problem**: Limelight web interface won''t open
**Solution**: Check IP address, usually `10.TE.AM.11:5800`

**Problem**: Pipeline switching not working
**Solution**: Use NetworkTables to switch: `limelightTable.getEntry("pipeline").setNumber(1);`

**Problem**: LEDs not working
**Solution**: Check LED mode in web interface, verify power connection

### PhotonVision Issues

**Problem**: Camera not detected
**Solution**: Check USB connection, try different port

**Problem**: High CPU usage
**Solution**: Lower camera resolution, reduce FPS

**Problem**: Pipeline not saving
**Solution**: Check file permissions, verify storage space

---

## Performance Tips

### Improve Vision Performance:
1. **Lower resolution** if accuracy is sufficient.
2. **Reduce FPS** if updates are too fast.
3. **Filter targets** to only use necessary ones.
4. **Average readings** to reduce noise.
5. **Use spatial filtering** to reject impossible poses.

### Optimize Vision Integration:
1. **Update vision** at consistent rate (20Hz is good)
2. **Reject outliers** that disagree with odometry.
3. **Use timeouts** on old vision data.
4. **Smooth vision updates** with averaging.
5. **Fall back to odometry** if vision fails.

---

## When to Get Help

If vision still doesn''t work after trying these fixes:

### Good Help Request:
```
"My vision system isn''t detecting targets correctly.

Setup: Limelight 3, AprilTags 36h11, mounted 0.2m forward of robot center

Symptoms:
- Camera feed shows tags clearly
- Pipeline reports ''No target'' most of the time
- When it does detect, distance is off by ~0.5m

What I''ve tried:
- Recalibrated camera intrinsics
- Adjusted exposure (tried 10, 30, 50)
- Switched to AprilTag pipeline
- Verified correct AprilTag family

NetworkTables show:
- ''tv'' (target valid) = 0 most of time
- ''ta'' (target area) varies wildly when target detected
- ''tx''/''ty'' (target angle) seem reasonable

What should I check next?"
```

---

## Related Guides

- [Vision Setup Guide](/subsystems/vision)
- [AprilTag Tracking](/subsystems/vision)
- [PhotonVision Integration](/subsystems/vision)
- [Limelight Setup](/subsystems/vision)
- [Odometry Integration](/subsystems/vision)

---

**Remember**: Vision systems are powerful but complex. Start simple, test thoroughly, and always have a backup plan (like odometry-only autonomous) when vision fails!

**Still struggling?** [Share your vision challenges](https://github.com/MARSProgramming/MARSLib/discussions) - the community can help troubleshoot!' WHERE slug = 'troubleshooting-vision-systems';