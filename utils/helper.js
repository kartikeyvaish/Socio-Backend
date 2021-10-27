const get_mime_type = (File) => {
  let URL = File.toLowerCase();

  let ImageExts = ["jpg", "png", "jpeg"];
  let VideoExts = ["mp4", "3gp"];
  let AudioExts = ["m4a", "mp3", "wav"];
  let Exts = URL.split(".").pop();

  if (ImageExts.indexOf(Exts) > -1)
    return `image/${ImageExts[ImageExts.indexOf(Exts)]}`;
  else if (VideoExts.indexOf(Exts) > -1)
    return `video/${VideoExts[VideoExts.indexOf(Exts)]}`;
  else if (AudioExts.indexOf(Exts) > -1)
    return `audio/${AudioExts[AudioExts.indexOf(Exts)]}`;
  else return "none";
};

const get_mime_name = (File) => {
  let URL = File.toLowerCase();

  let ImageExts = ["jpg", "png", "jpeg"];
  let VideoExts = ["mp4", "3gp"];
  let AudioExts = ["m4a", "mp3", "wav"];
  let Exts = URL.split(".").pop();

  if (ImageExts.indexOf(Exts) > -1) return `image`;
  else if (VideoExts.indexOf(Exts) > -1) return `video`;
  else if (AudioExts.indexOf(Exts) > -1) return `audio`;
  else return "none";
};

const helperFunctions = {
  get_mime_type,
  get_mime_name,
};

exports.helperFunctions = helperFunctions;
