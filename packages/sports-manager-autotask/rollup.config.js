import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import builtins from 'builtin-modules';

export default {
    input: 'src/index.js',
    output: {
        file: 'dist/index.js',
        format: 'cjs',
    },
    plugins: [
        resolve({ preferBuiltins: true }),
        commonjs(),
        json({ compact: true }),
        typescript(),
    ],
    external: [
        ...builtins,
        'ethers',
        'web3',
        'axios',
        /^defender-relay-client(\/.*)?$/,
    ],
};