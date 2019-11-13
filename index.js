#!/usr/bin/env node
(async () => {
  const puppeteer = require('puppeteer-core')
  const updateActionsWebhook = require('./updateActionsWebhook')
  const fs = require("fs");
  const fileName = process.argv.splice(2)[0]
  const content = fs.readFileSync(fileName)
  const { app, commands, workspace, baseUrl, username, password, userDataDir, executablePath, actionsWebhook } = JSON.parse(content.toString())
  const browser = await puppeteer.launch({
    // headless: false,
    userDataDir: userDataDir,
    executablePath: executablePath,
  })

  const page = await browser.newPage()

  const response = await page.goto(`https://${workspace}.slack.com/`)

  // await page.waitForNavigation()

  const chain = response.request().redirectChain()

  if (chain.length === 0) {

    await page.evaluate(data => document.querySelector(data.selector).value = data.value, {
      selector: 'input[type=email]',
      value: username,
    })

    await page.evaluate(data => document.querySelector(data.selector).value = data.value, {
      selector: 'input[type=password]',
      value: password,
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
    try {
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
    } catch (error) {
      console.log(error)
    }
  }

  // Create
  for (let i in commandsToCreate) {
    try {
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
    } catch (error) {
        console.log(error)
    }
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

})()


