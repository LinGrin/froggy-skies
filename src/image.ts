import { getImageSelection, saveImageSelection } from './image-selection';
import { WeatherType } from './models';
import { MIN_WARM_TEMP, IMAGE_SOURCE_URL } from './constants'

type FileType = 'background' | 'icon';

const warmCounts = {
    'clear-day': 11,
    'clear-night': 7,
    'partly-cloud-day': 8,
    'partly-cloud-night': 3,
    'cloud-day': 3,
    'cloud-night': 3,
    'rain': 6,
    'thunderstorm': 2,
    'snow': 0,        // these shouldn't be possible
    'wintry-mix': 0,
    'mist': 1,
    'error': 2,
  };

  const coldCounts = {
    'clear-day': 6,
    'clear-night': 7,
    'partly-cloud-day': 6,
    'partly-cloud-night': 3,
    'cloud-day': 5,
    'cloud-night': 1,
    'rain': 6,
    'thunderstorm': 2,
    'snow': 4,
    'wintry-mix': 2,
    'mist': 1,
    'error': 2,
  };

/** Pick best image for the provided weather type */
async function pickBestImage(weatherType: WeatherType, feelsLikeTemp: number): Promise<string> {
  const isWarm = feelsLikeTemp >= MIN_WARM_TEMP;

  // tbd for how to handle warmth later, phone frog pics don't
  // have temperature specific versions it seems
  const warmString = isWarm ? 'warm' : 'cold';
  const cacheKey = `${warmString}-${weatherType.main}-${weatherType.icon}`;
  const cached = await getImageSelection(cacheKey);
  if (cached) {
    return cached;
  }

  let prefix = '';
  const countsMap = isWarm ? warmCounts : coldCounts;

  // todo: enhance with codes instead of icon
  switch (weatherType.icon) {

    // clear day
    case '01d':
      prefix = 'clear-day';
      break;

    // clear night
    case '01n':
      prefix = 'clear-night';
      break;

    // partly cloudy
    case '02d':
    case '03d':
      prefix = 'partly-cloud-day';
      break;

    //  partly cloudy night
    case '02n':
    case '03n':
      prefix = 'partly-cloud-night';
      break;

    // cloudy
    case '04d':
      prefix = 'cloud-day';
      break;

    // cloudy night
    case '04n':
      prefix = 'cloud-night';
      break;

    // rain-day
    case '09d':
    case '10d':
      prefix = 'rain';
      break;

    // rain-night
    case '09n':
    case '10n':
      prefix = 'rain';
      break;

    // thunderstorm
    case '11d':
    case '11n':
      prefix = 'thunderstorm';
      break;

    // snow
    case '13d':
    case '13n':
      // weird case for freezing rain also having this icon
      if (weatherType.code===511 || weatherType.code===611) {
        prefix = 'wintry-mix';
      } else {
        prefix = 'snow';
      }
      break;

    // mist
    case '50d':
    case '50n':
      prefix = 'mist';
      break;

    // error or missing type
    default:
      log('Bad type provided!');
      log(weatherType);
      prefix = 'error';
      break;
  }

  const count = countsMap[prefix];

  // randomize image
  const index = Math.floor(Math.random() * (count - 1) + 1);
  
  const image = `${warmString}_${prefix}-${`${index}`.padStart(2, '0')}.jpg`;

  // cache and return
  saveImageSelection(cacheKey, image);
  return image;
}

/** Download image from repository (or local icloud) */
export async function getImage(weatherType: WeatherType, feelsLikeTemp: number, fileType: FileType, destinationFolder: string = 'weather'): Promise<Image> {
  const filename = fileType === 'icon' ? `${weatherType.icon}.png` : await pickBestImage(weatherType, feelsLikeTemp);

  const iCloud = FileManager.iCloud();
  const destinationFolderPath = iCloud.joinPath(iCloud.documentsDirectory(), iCloud.joinPath(destinationFolder, fileType));
  const filePath = iCloud.joinPath(destinationFolderPath, filename);

  if (!iCloud.fileExists(filePath)) {
    log(`Image not found in icloud: ${filename}`);

    // create folder if missing
    if (!iCloud.fileExists(destinationFolderPath)) {
      log(`Creating folder: ${destinationFolderPath}`);
      iCloud.createDirectory(destinationFolderPath, true);
    }

    // Images are downloaded from repo first time
    // Once they are downloaded, they will be read from personal icloud.
    const url = `${IMAGE_SOURCE_URL}/${fileType}/${filename}`;
    log(`Downloading image: ${filename}`);

    const request = new Request(url);
    const image = await request.loadImage().catch(ex => {
      log('Error when download image!');
      log(ex);
      return null;
    });

    if (image) {
      log(`Saving image to disk: ${filename}`);
      iCloud.writeImage(filePath, image);
    }

    // check again after downloading
    if (!iCloud.fileExists(filePath)) {
      log('Image not found after supposedly downloading, check logs!');
    }
  }

  await iCloud.downloadFileFromiCloud(filePath);
  return iCloud.readImage(filePath);
}
