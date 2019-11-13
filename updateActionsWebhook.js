const fetch = require('node-fetch')

const updateActionsWebhook = (params) => {
  const {
    app,
    token,
    url,
  } = params
  const boundary = '--WebKitBoundarySIACK'
  return fetch(
     'https://api.slack.com/api/developer.apps.actions.update',
     {
       credentials: 'include',
       headers: {
         accept: '*/*',
         'accept-language': 'en-US,en;q=0.9,es;q=0.8,gl;q=0.7',
         'content-type': `multipart/form-data; boundary=${boundary}`,
       },
       referrerPolicy: 'no-referrer',
       body: `--${boundary}\r\nContent-Disposition: form-data; name="app_id"\r\n\r\n${app}\r\n--${boundary}\r\nContent-Disposition: form-data; name="token"\r\n\r\n${token}\r\n--${boundary}\r\nContent-Disposition: form-data;  name="action_url"\r\n\r\n${url}\r\n--${boundary}\r\nContent-Disposition: form-data; name="actions"\r\n\r\n[]\r\n--${boundary}\r\nContent-Disposition: form-data; name="_x_mode"\r\n\r\nonline\r\n--${boundary}--\r\n`,
       method: 'POST',
       mode: 'cors',
     }
  ).then(response => {
    return response.json()
  })
}

module.exports = updateActionsWebhook
