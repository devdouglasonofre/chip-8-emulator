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
    console.log(instruction);

    cpu.instructionPointer += 0x2;

    switch (nibbles[0]) {
        case 0x0:
            if (nibbles[1] === 0x0) {
                if (nibbles[3] === 0x0) {
                    for (let i = 0; i < WIDTH * HEIGHT; i++) {
                        cpu.memory[VRAM_START_ADDRESS + i] = 0x0;
                    }
                } else {
                    console.log("saí de subrotina");
                    console.log(cpu.stack);
                    cpu.instructionPointer = cpu.stack.pop();
                    console.log(cpu.instructionPointer);
                }
            } else {
                console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1");
                run(memoryAddress);
            }
            break;
        case 0x1:
            cpu.instructionPointer = memoryAddress;
            break;
        case 0x2:
            console.log("entrei de subrotina");
            cpu.stack.push(memoryAddress);
            cpu.instructionPointer = cpu.stack[cpu.stack.length - 1];
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
                    cpu.registers.general[nibbles[2]][0] = cpu.registers.general[nibbles[1]][0];
                    break;
                case 0x1:
                    cpu.registers.general[nibbles[1]][0] = cpu.registers.general[nibbles[1]][0] || cpu.registers.general[nibbles[2]][0] ? 1 : 0;
                    break;
                case 0x2:
                    cpu.registers.general[nibbles[1]][0] = cpu.registers.general[nibbles[1]][0] && cpu.registers.general[nibbles[2]][0] ? 1 : 0;
                    break;
                case 0x3:
                    cpu.registers.general[nibbles[1]][0] = cpu.registers.general[nibbles[1]][0] !== cpu.registers.general[nibbles[2]][0] ? 1 : 0;
                    break;
                case 0x4:
                    cpu.registers.general[0xf][0] = cpu.registers.general[nibbles[1]][0] + cpu.registers.general[nibbles[2]][0] > 255 ? 1 : 0;
                    break;
                case 0x5:
                    cpu.registers.general[0xf][0] = cpu.registers.general[nibbles[2]][0] - cpu.registers.general[nibbles[1]][0] > 0 ? 1 : 0;
                    break;
                case 0x6:
                    cpu.registers.general[nibbles[1]][0] = cpu.registers.general[nibbles[2]][0] >> 1;
                    cpu.registers.general[0xf][0] = parseInt(nibbles[2].toString(2).split("").pop());
                    break;
                case 0x7:
                    let subResult = cpu.registers.general[nibbles[2]][0] - cpu.registers.general[nibbles[1]][0];

                    if (subResult < 0) {
                        subResult += 255;
                        cpu.registers.general[0xf][0] = 0;
                    } else {
                        cpu.registers.general[0xf][0] = 1;
                    }
                    cpu.registers.general[nibbles[1]][0] = subResult;
                    break;
                case 0xe:
                    cpu.registers.general[nibbles[1]][0] = cpu.registers.general[nibbles[2]][0] << 1;
                    cpu.registers.general[0xf][0] = parseInt(nibbles[2].toString(2).split("").shift());
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
            // TODO: Add Random Number with Masking
            cpu.registers.general[nibbles[1]][0] = 1;
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

                for (let bit = 0; bit < binaryData.length; bit++) {
                    pixelPointer++;
                    cpu.memory[pixelPointer] = parseInt(binaryData[bit]) !== cpu.memory[pixelPointer] ? 1 : 0;
                    if (cpu.memory[pixelPointer] === 0) {
                        pixelHasChangedToUnset = true;
                    }
                }
                pixelPointer += WIDTH;
            });

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
            console.log("fiz coisinha rs");
            switch (nibbles[2]) {
                case 0x0:
                    if (nibbles[3] === 0x7) {
                        cpu.registers.general[nibbles[1]][0] = cpu.timers.delay[0];
                    } else {
                        // TODO: Wait for Keypress
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
                    console.log("Fiz algo aqui");
                    const binaryCodedDecimal = cpu.registers.general[nibbles[1]][0] + 0;
                    cpu.memory[cpu.registers.address.i[0]] = binaryCodedDecimal;
                    cpu.memory[cpu.registers.address.i[0] + 1] = binaryCodedDecimal;
                    cpu.memory[cpu.registers.address.i[0] + 2] = binaryCodedDecimal;
                    break;
                case 0x5:
                    console.log("Aqui també,");
                    for (let i = 0; i <= nibbles[1]; i++) {
                        cpu.memory[cpu.registers.address.i] = cpu.registers.general[i][0];
                        cpu.registers.address.i[0] += nibbles[1] + 1;
                    }
                    break;
                case 0x6:
                    for (let i = 0; i <= nibbles[1]; i++) {
                        cpu.registers.general[i][0] = cpu.memory[cpu.registers.address.i[0]];
                        cpu.registers.address.i[0] += nibbles[1] + 1;
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
        if (cpu.timers.delay > 0x0) {
            cpu.timers.delay--;
        }
        if (cpu.timers.sound > 0x0) {
            cpu.timers.sound--;
        }
        run(cpu.instructionPointer);

        drawToContext();
    }, 1000 / 60);
}

input_file.addEventListener("input", (e) => {
    e.target.files[0].arrayBuffer().then((fileBuffer) => {
        const fileView = new Uint8Array(fileBuffer);
        console.log(fileBuffer);
        for (let i = 0; i < fileView.length; i++) {
            cpu.memory[0x200 + i] = fileView[i];
        }

        main();
    });
});
