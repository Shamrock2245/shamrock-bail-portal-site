function setInternalGASUrl() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('GAS_WEBHOOK_URL', 'https://script.google.com/macros/s/AKfycbwd5zOQmkwNgvVCjFo2QJchGgzKMvt2IRA_PylVI2YokEl18LKvdGpie92tvZmQh8v4IA/exec');
  console.log('✅ Set GAS_WEBHOOK_URL successfully.');
}
