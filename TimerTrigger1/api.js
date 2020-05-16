const axios = require('axios')
module.exports = class APIRequestManager {
    static get(url, headers = {}, params = {}) {
        return axios.get(url, { headers }, { params })
    }

    static post(url, headers = {}, data = {}) {
        return axios.post(url, data , { headers })
    }

    static delete(url, headers = {}) {
        return axios.delete(url, { headers })
    }
}