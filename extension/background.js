// Currently just used to access the browser local storage for prompts persistence.

browser.runtime.onMessage.addListener(async (message) => 
{
  if (message.command === "store") 
  {
    const storeObject = {};
    storeObject[message.key] = message.data;
    await browser.storage.local.set(storeObject);
    return Promise.resolve({response: "Data stored successfully"});
  }

  if (message.command === "retrieve") 
  {
    const results = await browser.storage.local.get(message.key);

    if (message.key in results)
      return Promise.resolve({success: true, data: results[message.key]});
    else
      return Promise.resolve({success: false})
  }
});