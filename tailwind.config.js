const {heroui} = require("@heroui/theme");

/** @type {import('tailwindcss').Config} **/
module.exports = {
    content: [
        "./node_modules/@heroui/theme/dist/components/*.js",
        './node_modules/@heroui/theme/dist/components/(button|snippet|code|input).js'
    ],
    theme: {
        extend: {},
    },
    darkMode: "class",
    plugins: [heroui()],
};