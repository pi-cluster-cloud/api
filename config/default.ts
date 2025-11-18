export default {
    port: 1337,
    saltRounds: 10,
    jwtAlgorithm: 'HS256',
    accessTokenTtl: 3600, // 1hr
    refreshTokenTtl: 25200 // 1w
};