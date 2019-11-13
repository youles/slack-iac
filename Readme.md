# Slack Iac
Tool to add multiple slash commands to an slack app.

To run:

```
npm install

node index.js config.json
```

## Consideration:

1. The commands not registered in the config.json that are already in the server will be deleted
2. The commmands registered in the config.json that are already in the server will be updated
3. All other commands registered will be created