// HTML constants
const canvas = document.getElementById("canvas");
const input_file = document.getElementById("input_file");

const cpu = {
    memory: new Uint8Array(0xffff),
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
            i: new Uint8Array(0x2),
        },
    },
    stack: new Array(0x10),
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
        parseInt(instructionBinary.slice(0, 0x4), 2),
        parseInt(instructionBinary.slice(0x5, 0x8), 2),
        parseInt(instructionBinary.slice(0x9, 0xc), 2),
        parseInt(instructionBinary.slice(0xd, instructionBinary.length), 2),
    ];

    const memoryAddress = parseInt(instructionBinary.slice(0x5, instructionBinary.length), 2);
    const byteConstant = parseInt(instructionBinary.slice(0x9, instructionBinary.length), 2);

    console.log(nibbles);

    switch (nibbles[0]) {
        case 0x0:
            if (nibbles[1] === 0x0) {
                if (nibbles[3] === 0x0) {
                    // TODO: Clear Screen
                } else {
                    cpu.stack.pop();
                    cpu.instructionPointer = cpu.stack[cpu.stack.length - 1];
                }
            } else {
                run(memoryAddress);
            }
            break;
        case 0x1:
            cpu.instructionPointer = memoryAddress;
            break;
        case 0x2:
            cpu.stack.push(memoryAddress);
            cpu.instructionPointer = cpu.stack[cpu.stack.length - 1];
            break;
        case 0x3:
            if (cpu.registers.general[nibbles[1]] === byteConstant) {
                cpu.instructionPointer++;
            }
            break;
        case 0x4:
            if (cpu.registers.general[nibbles[1]] !== byteConstant) {
                cpu.instructionPointer++;
            }
            break;
        case 0x5:
            if (cpu.registers.general[nibbles[1]] === cpu.registers.general[nibbles[2]]) {
                cpu.instructionPointer++;
            }
            break;
        case 0x6:
            cpu.registers.general[nibbles[1]] = byteConstant;
            break;
        case 0x7:
            cpu.registers.general[nibbles[1]] += byteConstant;
            break;
        case 0x8:
            switch (nibbles[3]) {
                case 0x0:
                    cpu.registers.general[nibbles[2]] = cpu.registers.general[nibbles[1]];
                    break;
                case 0x1:
                    cpu.registers.general[nibbles[1]] = cpu.registers.general[nibbles[1]] || cpu.registers.general[nibbles[2]] ? 1 : 0;
                    break;
                case 0x2:
                    cpu.registers.general[nibbles[1]] = cpu.registers.general[nibbles[1]] && cpu.registers.general[nibbles[2]] ? 1 : 0;
                    break;
                case 0x3:
                    cpu.registers.general[nibbles[1]] = cpu.registers.general[nibbles[1]] !== cpu.registers.general[nibbles[2]] ? 1 : 0;
                    break;
                case 0x4:
                    cpu.registers.general[0xf] = cpu.registers.general[nibbles[1]] + cpu.registers.general[nibbles[2]] > 255 ? 1 : 0;
                    break;
                case 0x5:
                    cpu.registers.general[0xf] = cpu.registers.general[nibbles[2]] - cpu.registers.general[nibbles[1]] > 0 ? 1 : 0;
                    break;
                case 0x6:
                    cpu.registers.general[nibbles[1]] = cpu.registers.general[nibbles[2]] >> 1;
                    cpu.registers.general[0xf] = parseInt(parseIntnibbles[2].toString(2).split("").pop());
                    break;
                case 0x7:
                    let subResult = cpu.registers.general[nibbles[2]] - cpu.registers.general[nibbles[1]];

                    if (subResult < 0) {
                        subResult += 255;
                        cpu.registers.general[0xf] = 0;
                    } else {
                        cpu.registers.general[0xf] = 1;
                    }
                    cpu.registers.general[nibbles[1]] = subResult;
                    break;
                case 0xe:
                    cpu.registers.general[nibbles[1]] = cpu.registers.general[nibbles[2]] << 1;
                    cpu.registers.general[0xf] = parseInt(parseIntnibbles[2].toString(2).split("").shift());
                    break;
            }
            break;
        case 0x9:
            if (cpu.registers.general[nibbles[1]] !== cpu.registers.general[nibbles[2]]) {
                cpu.instructionPointer++;
            }
            break;
        case 0xa:
            cpu.registers.address.i = memoryAddress;
            break;
        case 0xb:
            cpu.instructionPointer = memoryAddress + cpu.registers.general[0x0];
            break;
        case 0xc:
            // TODO: Add Random Number with Masking
            cpu.registers.general[nibbles[1]] = 1;
            break;
        case 0xd:
            // TODO: Sprite Stuff
            break;
        case 0xe:
            if (nibbles[3] === 0xe) {
                if (cpu.currentlyPressedKey === cpu.registers.general[nibbles[1]]) {
                    cpu.instructionPointer++;
                }
            } else {
                if (cpu.currentlyPressedKey !== cpu.registers.general[nibbles[1]]) {
                    cpu.instructionPointer++;
                }
            }
            break;
        case 0xf:
            switch (nibbles[2]) {
                case 0x0:
                    if (nibbles[3] === 0x7) {
                        cpu.registers.general[nibbles[1]] = cpu.timers.delay;
                    } else {
                        // TODO: Wait for Keypress
                    }
                    break;
                case 0x1:
                    switch (nibbles[3]) {
                        case 0x5:
                            cpu.timers.delay = cpu.registers.general[nibbles[1]];
                            break;
                        case 0x8:
                            cpu.timers.sound = cpu.registers.general[nibbles[1]];
                            break;
                        case 0xe:
                            cpu.registers.address.i += cpu.registers.general[nibbles[1]];
                            break;
                    }
                    break;
                case 0x2:
                    cpu.registers.address.i = cpu.registers.general[nibbles[1]];
                    break;
                case 0x3:
                    const binaryCodedDecimal = cpu.registers.general[nibbles[1]] + 0;
                    cpu.memory[cpu.registers.address.i] = binaryCodedDecimal;
                    cpu.memory[cpu.registers.address.i + 1] = binaryCodedDecimal;
                    cpu.memory[cpu.registers.address.i + 2] = binaryCodedDecimal;
                    break;
                case 0x5:
                    for (let i = 0; i <= nibbles[1]; i++) {
                        cpu.memory[cpu.registers.address.i] = cpu.registers.general[i];
                        cpu.registers.address.i += nibbles[1] + 1;
                    }
                    break;
                case 0x6:
                    for (let i = 0; i <= nibbles[1]; i++) {
                        cpu.registers.general[i] = cpu.memory[cpu.registers.address.i];
                        cpu.registers.address.i += nibbles[1] + 1;
                    }
                    break;
            }

            break;
    }
    console.log(cpu.instructionPointer);
    cpu.instructionPointer++;
}

function convertDecimalByteToBinary(byte) {
    let binary = byte.toString(2);
    while (binary.length < 8) {
        binary = "0" + binary;
    }
    return binary;
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
