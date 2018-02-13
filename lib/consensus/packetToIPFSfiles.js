module.exports = function packetToIPFSFiles(packet) {
  const dir = { path: `/${packet.meta.id}` };

  // eslint-disable-next-line arrow-body-style
  const files = packet.data.objects.map((object) => {
    return {
      path: `/${packet.meta.id}/${object.meta.id}`,
      content: Buffer.from(JSON.stringify(object.data)),
    };
  });

  return [dir].concat(files);
};
