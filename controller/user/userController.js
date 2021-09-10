const crypto = require('crypto');
const { google } = require('googleapis')

const Session = require('../../models/tokens/webSession');
const User = require('../../models/user/user');

const errorHandler = require('../../utils/errorHandler');
const requestHandler = require('../../utils/requestHandler');
const responseHandler = require('../../utils/responseHandler');

const client_id = process.env.APP_ID;
const client_secret = process.env.APP_SECRET;
const { OAuth2 } = google.auth

const oAuth2Client = new OAuth2(
    client_id,
    client_secret
)

const headers = {
    'content-type': 'application/json',
    'cache-control': 'no-cache',
    'connection': 'keep-alive'
};

class UserController {
    static async getUser(code) {
        const { data } = await requestHandler({
            url: `https://oauth2.googleapis.com/token`,
            verb: 'post',
            payload: {
                client_id, client_secret,
                redirect_uri: 'http://localhost:3000/',
                grant_type: 'authorization_code',
                code,
            }
        })
        headers['authorization'] = `Bearer ${data.access_token}`;
        const resp = await requestHandler({
            url: 'https://www.googleapis.com/oauth2/v2/userinfo',
            method: 'get',
            headers
        });
        return { resp, auth: data };
    }

    static async refresh(req) {
        const { data } = await requestHandler({
            url: `https://oauth2.googleapis.com/token`,
            verb: 'post',
            payload: {
                client_id, client_secret,
                refresh_token: req.user.refresh_token,
                grant_type: 'refresh_token',
            }
        })
        const { access_token, expires_in } = data;
        const token_expires_in = Date.now() + ((Number(expires_in) - 300) * 1000);
        let user = await User.findOneAndUpdate({ _id: req.user._id }, { access_token, token_expires_in }, { new: true })
            .select('+access_token +token_expires_in').lean();
        req.user = user
        return req;
    }

    static async login(req, res, next) {
        try {
            const { code } = req.body;
            const { resp, auth } = await UserController.getUser(code)
            const { data } = resp;
            const { refresh_token, access_token, expires_in } = auth;
            const token_expires_in = Date.now() + ((Number(expires_in) - 300) * 1000);
            let user = await User.findOneAndUpdate({ email: data.email }, { refresh_token, access_token, token_expires_in })
                .select('name email');

            if (!user) {
                user = await User.create({ ...data, ...auth, created_at: Date(), token_expires_in })
            }
            const sess_code = crypto.randomBytes(15).toString('base64');
            await Session.create({
                createdAt: Date(), session_token: sess_code, user_id: user._id
            })
            // { access_token, expires_in, token_type, refresh_token }
            req.session_token = sess_code;
            req.user = user.toObject();
            return next();
        } catch (error) {
            return next(error);
        }
    }

    static async getCalenderEvents(req, res, next) {
        try {
            const dateTimeStart = new Date().toISOString();
            let interval = Date.now() + 60 * 24 * 60 * 60 * 1000 // next 60 days
            let dateTimeEnd = new Date(interval).toISOString();

            oAuth2Client.setCredentials({
                refresh_token: req.user.refresh_token,
            })
            const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
            let resp = await calendar.events.list({
                calendarId: 'primary',
                timeMin: dateTimeStart,
                timeMax: dateTimeEnd
            })
            return responseHandler(res, resp.data, next, 200, 'Calender events successfully retrieved', 1);
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = UserController;