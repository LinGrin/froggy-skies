import { format } from 'date-fns';
import { getImage } from './image';
import { getWeatherData } from './weather';

(async () => {
  log('Getting weather...');
  const weatherData = await getWeatherData();

  log('Loading images...');
  console.log(weatherData.weather);
  const feelsLikeTemp = weatherData.main.feels_like;
  const backgroundImage = await getImage(weatherData.weather[0], feelsLikeTemp, 'background');
  const iconImage = await getImage(weatherData.weather[0], feelsLikeTemp, 'icon');

  // create widget + set background
  log('Creating widget...');
  const widget = new ListWidget();
  widget.addSpacer(0);

  /** Text color will change to black if background fails to set */
  let textColor = new Color('#ffffff');
  const degreeSymbol = '\u00B0';

  if (backgroundImage) {
    widget.backgroundImage = backgroundImage;
  }
  else {
    textColor = new Color('#000000');
    log('Background image missing, will not set!');
  }

  // icon
  log('1 - Icon');
  if (iconImage) {
    const widgetImage = widget.addImage(iconImage);
    widgetImage.imageSize = new Size(75, 75);
    widgetImage.rightAlignImage();
  }
  else {
    log('Icon image missing, will not set!');
  }

  // date
  log('2 - Date');
  const dateText = widget.addText(`${format(new Date(), 'cccc d')}, ${weatherData.weather[0].main}`);
  dateText.textColor = textColor;
  dateText.font = Font.regularSystemFont(15);
  dateText.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";

  // temperature
  log('3 - Temperature');
  const temperatureText = widget.addText(`${Math.round(weatherData.main.temp)}${degreeSymbol}`);
  temperatureText.textColor = textColor;
  temperatureText.font = Font.boldSystemFont(35);
  temperatureText.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";

  // feels like
  log('4 - Feels like');
  const feelsLikeText = widget.addText(`Feels like ${Math.round(weatherData.main.feels_like)}${degreeSymbol}`);
  feelsLikeText.textColor = textColor;
  feelsLikeText.font = Font.regularSystemFont(15);
  feelsLikeText.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";

  // city name
  log('5 - City name');
  const cityText = widget.addText(weatherData.name);
  cityText.textColor = textColor;
  cityText.font = Font.regularSystemFont(10);
  cityText.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";

  // last updated
  log('6 - Last updated');
  const lastUpdatedText = widget.addText(`Updated ${format(new Date(), 'HH:mm')}`);
  lastUpdatedText.textColor = textColor;
  lastUpdatedText.font = Font.regularSystemFont(10);
  lastUpdatedText.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";

  widget.addSpacer();

  log('Applying');
  Script.setWidget(widget);

})().catch(ex => {
  log('ROOT ERROR');
  log(ex);
});
