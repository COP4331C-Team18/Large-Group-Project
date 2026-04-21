module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 30000,
  moduleFileExtensions: ["ts", "js"],
  roots: ["<rootDir>/tests"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
};
