import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',         // or 'c8' if you prefer (requires @vitest/coverage-c8)
            reporter: ['text', 'lcov'], // ⬅️ generate the lcov.info file
            reportsDirectory: './coverage', // ⬅️ where lcov.info will be saved
        },
    },
});