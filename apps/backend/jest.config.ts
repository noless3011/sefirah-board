/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: "ts-jest/presets/default-esm",
    roots: ["<rootDir>/src"],
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true,
            },
        ],
    },
    setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
};
