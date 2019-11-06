#!/usr/bin/env node
(async () => {
  const puppeteer = require('puppeteer-core')
  const updateActionsWebhook = require('./updateActionsWebhook')

  const { app, commands, workspace, baseUrl, actionsWebhook } = {
    "app":  "AEASPAPJ7",
    "baseUrl" : "https://youles.ngrok.io/command/",
    "actionsWebhook" : "https://youles.ngrok.io/slackActionsWebhook",
    "workspace":  "youlesconnectdev",
    "commands": [
      {
        "name": "difundir_todos-local",
        "desc": "Envía un mensaje a todos los usuarios de Youles",
        "urlSuffix": "broadcastAll",
        "usage": "[Mensaje]",
      },
      {
        "name": "difundir_empresa-local",
        "desc": "Envía un mensaje a los usuarios de una empresa",
        "urlSuffix": "broadcastCompany",
        "usage": "[Mensaje]",
      },
      {
        "name": "responder_opciones-local",
        "desc": "Envía un mensaje con opciones en Telegram",
        "urlSuffix": "replyOptions",
        "usage": "",
      },
      {
        "name": "difundir_despues-local",
        "desc": "Envía un mensaje la mañana del día siguiente a todos los usuarios de Youles",
        "urlSuffix": "broadcastLater",
        "usage": "[Message]",
      },
      {
        "name": "s2s-local",
        "desc": "Regresa el s2s de un usuario",
        "urlSuffix": "userS2SCommand",
        "usage": "",
      },
      {
        "name": "activar_notificaciones-local",
        "desc": "Activa las notificaciones diarias de S2S",
        "urlSuffix": "activateDailyNotificationsCommand",
        "usage": "",
      },
      {
        "name": "desactivar_notificaciones-local",
        "desc": "Desactiva las notificaciones de S2S",
        "urlSuffix": "deactivateDailyNotificationsCommand",
        "usage": "",
      },
      {
        "name": "asociar_base_de_datos-local",
        "desc": "Asocia un archivo de Google Sheets a un usuario",
        "urlSuffix": "linkSpreadsheetCommand",
        "usage": "[spreadsheetId]",
      },
      {
        "name": "obtener_link-local",
        "desc": "Obtiene el link para la base de datos del usuario",
        "urlSuffix": "openSpreadsheetCommand",
        "usage": "",
      },
      {
        "name": "resumen_diario-local",
        "desc": "Muestra el resumen del usuario del día de hoy",
        "urlSuffix": "dailyBreakdownCommand",
        "usage": "",
      },
      {
        "name": "resumen_impactos-local",
        "desc": "Muestra el resumen de impactos del usuario",
        "urlSuffix": "impactBreakdownCommand",
        "usage": "",
      },
      {
        "name": "balance_cuenta-local",
        "desc": "Muestra el balance actual de la cuenta del usuario.",
        "urlSuffix": "accountBalanceCommand",
        "usage": "",
      },
    ]
  }

  const browser = await puppeteer.launch({
    // headless: false,
    userDataDir: '/Users/Adrian/Library/Application Support/Google/Chrome/Default',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  })

  const page = await browser.newPage()

  const response = await page.goto(`https://${workspace}.slack.com/`)

  // await page.waitForNavigation()

  const chain = response.request().redirectChain()

  if (chain.length === 0) {

    await page.evaluate(data => document.querySelector(data.selector).value = data.value, {
      selector: 'input[type=email]',
      value: 'adrian@youles.mx',
    })

    await page.evaluate(data => document.querySelector(data.selector).value = data.value, {
      selector: 'input[type=password]',
      value: 'zidxax-hedpos-gecRi7',
    })

    await Promise.all([
      page.click('#signin_btn'),
      page.waitForNavigation(),
    ])

  }

  await page.goto(`https://api.slack.com/apps/${app}/slash-commands`)

  const commandsOnSlack = await page.evaluate(() => Array.from(document.querySelectorAll('.app_slack_commands_actions')).map(node => ({
    name: node.getAttribute('data-name'),
    desc: node.getAttribute('data-desc'),
    url: node.getAttribute('data-url'),
    usage: node.getAttribute('data-usage'),
    command: node.getAttribute('data-command'),
  })))



  const commandNamesOnSlack = commandsOnSlack.map(({ name }) => name.replace('/',''))
  const commandNames = commands.map(({ name }) => name)

  const commandNamesToUpdate = commandNamesOnSlack.filter((name) => commandNames.includes(name))
  const commandNamesToRemove = commandNamesOnSlack.filter((name)  => !commandNames.includes(name))
  const commandNamesToCreate = commandNames.filter((name) => !commandNamesOnSlack.includes(name))


  const processedCommands = commands.map(command => {
    const commandOnSlack = commandsOnSlack.find(({ name }) => name.replace('/','') === command.name) || {}
    return {
      // token,
      id: commandOnSlack.command,
      ...command,
      url: (baseUrl + command.urlSuffix)
    }
  })

  const commandsToUpdate = processedCommands.filter(({ name }) => commandNamesToUpdate.includes(name))
  const commandsToRemove = commandsOnSlack.filter(({ name }) => commandNamesToRemove.includes(name))
  const commandsToCreate = processedCommands.filter(({ name }) => commandNamesToCreate.includes(name))


  // Update
  for (let i in commandsToUpdate) {

    const currentCommand = commandsToUpdate[i]
    console.log('Updating... ', currentCommand.name)
    await page.evaluate((data) => {
      const { id } = data
      document.querySelector('[data-command="'+id+'"] > .ts_icon_pencil').click()

    },currentCommand)

    await page.waitForSelector('input[data-qa="command_name"]')

    await page.evaluate((data) => {
      const { url, desc, usage } = data
      document.querySelector(`input[data-qa="command_request_url"]`).value = url
      document.querySelector(`input[data-qa="command_description"]`).value = desc
      document.querySelector(`input[data-qa="command_usage_hint"]`).value = usage
      document.querySelector('button[data-qa="save_button"').click()
    },currentCommand)

    await page.waitForNavigation()

  }

  // Create
  for (let i in commandsToCreate) {
    const currentCommand = commandsToCreate[i]

    console.log('Creating... ', currentCommand.name)
    await page.evaluate(() => {
      document.querySelector('button[data-qa="add_slack_command"]').click()
    })

    await page.waitForSelector('input[data-qa="command_name"]')

    await page.evaluate((data) => {
      const { name, url, desc, usage } = data
      document.querySelector(`input[data-qa="command_name"]`).value = name
      document.querySelector(`input[data-qa="command_request_url"]`).value = url
      document.querySelector(`input[data-qa="command_description"]`).value = desc
      document.querySelector(`input[data-qa="command_usage_hint"]`).value = usage
      document.querySelector('button[data-qa="save_button"').click()
    },currentCommand)

    await page.waitForNavigation()

  }

  // Remove
  for (let i in commandsToRemove) {

    const currentCommand = commandsToRemove[i]
    console.log('Removing... ', currentCommand.name)

    await page.evaluate((data) => {
      const { command: id } = data
      console.log('data', data)
      document.querySelector('[data-command="'+id+'"] > .ts_icon_trash').click()

    },currentCommand)

    await page.waitForSelector('button[data-qa="generic_dialog_go"]')

    await page.evaluate(() => {
      document.querySelector('button[data-qa="generic_dialog_go"]').click()
    })

    await page.waitForNavigation()
  }


  const token = await page.evaluate(() => boot_data.api_token)
  await updateActionsWebhook({
    url: actionsWebhook,
    token,
    app,
  })

  console.log('Done!')
  await browser.close()


  /*
curl https://api.telegram.org/bot770623620:AAEvI9sQAmL4LZQ5v1yFFSSvaoZGoTbhz9c/setWebhook\?url\=https://5ea52433.ngrok.io/576D5A7133743677397A24432646294A404E635266556A586E327235753778214125442A472D4B6150645367566B59703373367639792F423F4528482B4D6251/telegramWebhook
  */


  /* CHANGE EVENTS!!!!!!!
  https://api.slack.com/apps/AEASPAPJ7/event-subscriptions?
  * */


})()


