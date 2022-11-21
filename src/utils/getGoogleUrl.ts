export const getGoogleAuthUrl = () => {
    const base = 'https://accounts.google.com/o/oauth2/v2/auth';

    const options = {
        redirect_uri: 'http://localhost:3000/api/oauth/google',
        client_id: '373965291205-utb8ih1hoeuf1g90okil5ju43tfdl3vs.apps.googleusercontent.com',
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ].join(' ')
    }
    const queryStr = new URLSearchParams(options)
    return `${base}?${queryStr.toString()}`
}