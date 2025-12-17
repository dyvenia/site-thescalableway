export const id = process.env.COMMIT_REF || process.env.BUILD_ID || 'dev-local';
export const time = new Date().toISOString();
