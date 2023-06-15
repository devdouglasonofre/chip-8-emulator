// HTML constants
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const input_file = document.getElementById("input_file");
const VRAM_START_ADDRESS = 0x6a0;
const WIDTH = 64;
const HEIGHT = 32;

const cpu = {
    memory: new Uint8Array(0xffff).fill(0x0),
    registers: {
        general: {
            0x0: new Uint8Array(0x1),
            0x1: new Uint8Array(0x1),
            0x2: new Uint8Array(0x1),
            0x3: new Uint8Array(0x1),
            0x4: new Uint8Array(0x1),
            0x5: new Uint8Array(0x1),
            0x6: new Uint8Array(0x1),
            0x7: new Uint8Array(0x1),
            0x8: new Uint8Array(0x1),
            0x9: new Uint8Array(0x1),
            0xa: new Uint8Array(0x1),
            0xb: new Uint8Array(0x1),
            0xc: new Uint8Array(0x1),
            0xd: new Uint8Array(0x1),
            0xe: new Uint8Array(0x1),
            0xf: new Uint8Array(0x1),
        },
        address: {
            i: new Uint16Array(0x1),
        },
    },
    stack: [],
    instructionPointer: null,
    timers: {
        delay: new Uint8Array(0x1),
        sound: new Uint8Array(0x1),
    },
    currentlyPressedKey: null,
};

function run(address) {
    let instructionBinary = "";
    cpu.memory.slice(address, address + 2).forEach((byte) => (instructionBinary += convertDecimalByteToBinary(byte)));

    const nibbles = [
        parseInt(instructionBinary.slice(0x0, 0x4), 2),
        parseInt(instructionBinary.slice(0x4, 0x8), 2),
        parseInt(instructionBinary.slice(0x8, 0xc), 2),
        parseInt(instructionBinary.slice(0xc, instructionBinary.length), 2),
    ];

    const memoryAddress = parseInt(instructionBinary.slice(0x4, instructionBinary.length), 2);
    const byteConstant = parseInt(instructionBinary.slice(0x8, instructionBinary.length), 2);

    let instruction = "";
    nibbles.forEach((nibble) => {
        instruction += nibble.toString(16).toUpperCase();
    });
    // console.log(instruction);

    const vxBinary = convertDecimalByteToBinary(cpu.registers.general[nibbles[1]][0]);
    const vyBinary = convertDecimalByteToBinary(cpu.registers.general[nibbles[2]][0]);
    let resultingBinary = "";

    cpu.instructionPointer += 0x2;

    switch (nibbles[0]) {
        case 0x0:
            if (nibbles[1] === 0x0) {
                if (nibbles[3] === 0x0) {
                    for (let i = 0; i < WIDTH * HEIGHT; i++) {
                        cpu.memory[VRAM_START_ADDRESS + i] = 0x0;
                    }
                } else {
                    cpu.instructionPointer = cpu.stack.pop();
                }
            } else {
                run(memoryAddress);
            }
            break;
        case 0x1:
            cpu.instructionPointer = memoryAddress;
            break;
        case 0x2:
            cpu.stack.push(cpu.instructionPointer);
            cpu.instructionPointer = memoryAddress;
            break;
        case 0x3:
            if (cpu.registers.general[nibbles[1]][0] === byteConstant) {
                cpu.instructionPointer += 0x2;
            }
            break;
        case 0x4:
            if (cpu.registers.general[nibbles[1]][0] !== byteConstant) {
                cpu.instructionPointer += 0x2;
            }
            break;
        case 0x5:
            if (cpu.registers.general[nibbles[1]][0] === cpu.registers.general[nibbles[2]]) {
                cpu.instructionPointer += 0x2;
            }
            break;
        case 0x6:
            cpu.registers.general[nibbles[1]][0] = byteConstant;
            break;
        case 0x7:
            cpu.registers.general[nibbles[1]][0] += byteConstant;
            break;
        case 0x8:
            switch (nibbles[3]) {
                case 0x0:
                    cpu.registers.general[nibbles[1]][0] = cpu.registers.general[nibbles[2]][0];
                    break;
                case 0x1:
                    for (let i = 0; i < vxBinary.length; i++) {
                        resultingBinary += parseInt(vxBinary[i]) || parseInt(vyBinary[i]) ? 1 : 0;
                    }

                    cpu.registers.general[nibbles[1]][0] = parseInt(resultingBinary, 2);
                    break;
                case 0x2:
                    for (let i = 0; i < vxBinary.length; i++) {
                        resultingBinary += parseInt(vxBinary[i]) && parseInt(vyBinary[i]) ? 1 : 0;
                    }

                    cpu.registers.general[nibbles[1]][0] = parseInt(resultingBinary, 2);
                    break;
                case 0x3:
                    for (let i = 0; i < vxBinary.length; i++) {
                        resultingBinary += parseInt(vxBinary[i]) !== parseInt(vyBinary[i]) ? 1 : 0;
                    }

                    cpu.registers.general[nibbles[1]][0] = parseInt(resultingBinary, 2);
                    break;
                case 0x4:
                    const hadCarry = cpu.registers.general[nibbles[1]][0] + cpu.registers.general[nibbles[2]][0] > 255 ? 1 : 0;
                    cpu.registers.general[nibbles[1]][0] = cpu.registers.general[nibbles[1]][0] + cpu.registers.general[nibbles[2]][0];
                    cpu.registers.general[0xf][0] = hadCarry;
                    break;
                case 0x5:
                    const hadBorrow = cpu.registers.general[nibbles[1]][0] > cpu.registers.general[nibbles[2]][0] ? 1 : 0;
                    cpu.registers.general[nibbles[1]][0] = cpu.registers.general[nibbles[1]][0] - cpu.registers.general[nibbles[2]][0];
                    cpu.registers.general[0xf][0] = hadBorrow;
                    break;
                case 0x6:
                    const leastSignificant = cpu.registers.general[nibbles[1]][0] & 0x1;
                    cpu.registers.general[nibbles[1]][0] = cpu.registers.general[nibbles[2]][0] >> 1;
                    cpu.registers.general[0xf][0] = leastSignificant;
                    break;
                case 0x7:
                    const hadBorrowAgain = cpu.registers.general[nibbles[2]][0] > cpu.registers.general[nibbles[1]][0] ? 1 : 0;
                    cpu.registers.general[nibbles[1]][0] = cpu.registers.general[nibbles[2]][0] - cpu.registers.general[nibbles[1]][0];
                    cpu.registers.general[0xf][0] = hadBorrowAgain;
                    break;
                case 0xe:
                    const mostSignificant = cpu.registers.general[nibbles[1]][0] >> 7;
                    cpu.registers.general[nibbles[1]][0] = cpu.registers.general[nibbles[2]][0] << 1;
                    cpu.registers.general[0xf][0] = mostSignificant;
                    break;
            }
            break;
        case 0x9:
            if (cpu.registers.general[nibbles[1]][0] !== cpu.registers.general[nibbles[2]][0]) {
                cpu.instructionPointer += 0x2;
            }
            break;
        case 0xa:
            cpu.registers.address.i[0] = memoryAddress;
            break;
        case 0xb:
            cpu.instructionPointer = memoryAddress + cpu.registers.general[0x0][0];
            break;
        case 0xc:
            const generatedBinary = convertDecimalByteToBinary(Math.floor(Math.random() * 256));
            const constantBinary = convertDecimalByteToBinary(byteConstant);
            let randomBinary = "";
            for (let i = 0; i < vxBinary.length; i++) {
                randomBinary += parseInt(generatedBinary[i]) && parseInt(constantBinary[i]) ? 1 : 0;
            }
            cpu.registers.general[nibbles[1]][0] = randomBinary;
            break;
        case 0xd:
            let X = cpu.registers.general[nibbles[1]][0];
            X = X > 0x3f ? X % 0x40 : X;
            let Y = cpu.registers.general[nibbles[2]][0];
            Y = Y > 0x1f ? Y % 0x20 : Y;
            const NUMBER_OF_BYTES = nibbles[3];

            let pixelHasChangedToUnset = false;

            const totalBytes = cpu.memory.slice(cpu.registers.address.i[0], cpu.registers.address.i[0] + NUMBER_OF_BYTES);

            totalBytes.forEach((byte, i) => {
                let pixelPointer = VRAM_START_ADDRESS + X + Y * WIDTH + WIDTH * i;
                const binaryData = convertDecimalByteToBinary(byte);

                for (const element of binaryData) {
                    const previousPixelValue = cpu.memory[pixelPointer];
                    cpu.memory[pixelPointer] = parseInt(element) !== cpu.memory[pixelPointer] ? 1 : 0;
                    if (previousPixelValue !== cpu.memory[pixelPointer] && cpu.memory[pixelPointer] === 0) {
                        pixelHasChangedToUnset = true;
                    }
                    pixelPointer++;
                }
                pixelPointer += WIDTH;
            });

            cpu.registers.general[0xf][0] = pixelHasChangedToUnset ? 1 : 0;
            break;
        case 0xe:
            if (nibbles[3] === 0xe) {
                if (cpu.currentlyPressedKey === cpu.registers.general[nibbles[1]][0]) {
                    cpu.instructionPointer += 0x2;
                }
            } else {
                if (cpu.currentlyPressedKey !== cpu.registers.general[nibbles[1]][0]) {
                    cpu.instructionPointer += 0x2;
                }
            }
            break;
        case 0xf:
            switch (nibbles[2]) {
                case 0x0:
                    if (nibbles[3] === 0x7) {
                        cpu.registers.general[nibbles[1]][0] = cpu.timers.delay[0];
                    } else {
                        console.log('mim dê papai')
                        let interval = setInterval(() => {

                            if (cpu.currentlyPressedKey) {
                                clearInterval(interval);
                            }
                        }, 1000 / 60);
                    }
                    break;
                case 0x1:
                    switch (nibbles[3]) {
                        case 0x5:
                            cpu.timers.delay = cpu.registers.general[nibbles[1]][0];
                            break;
                        case 0x8:
                            cpu.timers.sound = cpu.registers.general[nibbles[1]][0];
                            break;
                        case 0xe:
                            cpu.registers.address.i[0] += cpu.registers.general[nibbles[1]][0];
                            break;
                    }
                    break;
                case 0x2:
                    cpu.registers.address.i[0] = cpu.registers.general[nibbles[1]][0];
                    break;
                case 0x3:
                    const value = cpu.registers.general[nibbles[1]][0].toString().padStart(3, "0");
                    value.split("").forEach((number, i) => {
                        cpu.memory[cpu.registers.address.i[0] + i] = parseInt(number);
                    });
                    break;
                case 0x5:
                    for (let i = 0; i <= nibbles[1]; i++) {
                        cpu.memory[cpu.registers.address.i[0] + i] = cpu.registers.general[i][0];
                    }
                    break;
                case 0x6:
                    for (let i = 0; i <= nibbles[1]; i++) {
                        cpu.registers.general[i][0] = cpu.memory[cpu.registers.address.i[0] + i];
                    }
                    break;
            }

            break;
    }
}

function convertDecimalByteToBinary(byte) {
    let binary = byte.toString(2);
    while (binary.length < 8) {
        binary = "0" + binary;
    }
    return binary;
}

function drawToContext(i) {
    for (let i = 0; i < WIDTH * HEIGHT; i++) {
        ctx.fillStyle = cpu.memory[VRAM_START_ADDRESS + i] === 1 ? "#FFF" : "#000";
        ctx.fillRect(i % WIDTH, Math.trunc(i / (HEIGHT * 2)), 1, 1);
    }
}

function main() {
    cpu.instructionPointer = 0x200;

    setInterval(() => {
        run(cpu.instructionPointer);
    }, 1);

    setInterval(() => {
        if (cpu.timers.delay > 0x0) {
            cpu.timers.delay--;
        }
        if (cpu.timers.sound > 0x0) {
            cpu.timers.sound--;
        }

        drawToContext();
    }, 1000 / 60);
}

input_file.addEventListener("input", (e) => {
    e.target.files[0].arrayBuffer().then((fileBuffer) => {
        const fileView = new Uint8Array(fileBuffer);
        for (let i = 0; i < fileView.length; i++) {
            cpu.memory[0x200 + i] = fileView[i];
        }

        main();
    });
});

document.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "1":
        case "2":
        case "3":
            cpu.currentlyPressedKey = parseInt(`0x${e.key}`);
            break;
        case "4":
            cpu.currentlyPressedKey = 0xc;
            break;
        case "q":
            cpu.currentlyPressedKey = 0x4;
            break;
        case "w":
            cpu.currentlyPressedKey = 0x5;
            break;
        case "e":
            cpu.currentlyPressedKey = 0x6;
            break;
        case "r":
            cpu.currentlyPressedKey = 0xd;
            break;
        case "a":
            cpu.currentlyPressedKey = 0x7;
            break;
        case "s":
            cpu.currentlyPressedKey = 0x8;
            break;
        case "d":
            cpu.currentlyPressedKey = 0x9;
            break;
        case "f":
            cpu.currentlyPressedKey = 0xe;
            break;
        case "z":
            cpu.currentlyPressedKey = 0xa;
            break;
        case "x":
            cpu.currentlyPressedKey = 0x0;
            break;
        case "c":
            cpu.currentlyPressedKey = 0xb;
            break;
        case "v":
            cpu.currentlyPressedKey = 0xf;
            break;
    }
});

document.addEventListener("keyup", (e) => {
    cpu.currentlyPressedKey = null;
});
