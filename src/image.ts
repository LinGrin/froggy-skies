import { ICLOUD_FOLDER } from './constants';
import { log } from './log';

type FileType = 'background' | 'icon'

export async function getImage(weatherType: WeatherType, fileType: FileType, destinationFolder: string = 'weather'): Promise<Image> {
  const iCloud = FileManager.iCloud();
  const destinationFolderPath = `${ICLOUD_FOLDER}/${destinationFolder}/${fileType}`;
  const filePath = `${destinationFolderPath}/${file}.png`;

  if (!iCloud.fileExists(filePath)) {

    // create folder if missing
    if (!iCloud.fileExists(destinationFolderPath)) {
      log('Creating folder', destinationFolderPath);
      iCloud.createDirectory(destinationFolderPath, true);
    }

    // Images are downloaded from my repo first time
    // Once they are downloaded, they will be read from your icloud.
    const url = `https://github.com/submarines-and/froggy-skies/raw/master/${fileType}/${file}.png`;
    log('Downloading image', url);

    const request = new Request(url);
    const image = await request.loadImage();

    log('Saving image to disk', filePath);
    iCloud.writeImage(filePath, image);
  }

  log('Loading local image', filePath);
  return Image.fromFile(filePath);
}
