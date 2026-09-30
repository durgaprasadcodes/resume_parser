import axios from 'axios'

const api = axios.create({
    baseURL: "localHost",
    withCredentials: true
})