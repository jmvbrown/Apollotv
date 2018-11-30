// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/

module.exports = {
    apps: [
        {
            name: 'Rate Limiter',
            script: './rate-limiter.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '200M',
            env: {
                NODE_ENV: 'production'
            },
            env_development: {
                NODE_ENV: 'development'
            },
            "merge_logs": true,
            // disable_logs: true
        },
        {
            name: 'ApolloTV Server',
            script: 'server.js',
            instances: 'max',
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '200M',
            env: {
                NODE_ENV: 'production'
            },
            env_development: {
                NODE_ENV: 'development'
            },
            "merge_logs": true,
            // disable_logs: true
        }
    ]
};
