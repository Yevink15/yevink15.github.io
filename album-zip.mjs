// Store JPEGs without recompression. ZIP32 is sufficient for the public 1080p albums.
const table=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0});
export function makeZip(files){
 const chunks=[],central=[];let offset=0,centralSize=0;
 for(const {name,data} of files){
  const filename=new TextEncoder().encode(name);let crc=0xffffffff;
  for(const byte of data)crc=table[(crc^byte)&255]^(crc>>>8);
  crc=(crc^0xffffffff)>>>0;
  if(offset+data.length+filename.length+30>=0xffffffff)throw Error('Album too large for this browser download.');
  const header=new Uint8Array(30),h=new DataView(header.buffer);
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);
  h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,filename.length,true);
  chunks.push(header,filename,data);
  const directory=new Uint8Array(46),d=new DataView(directory.buffer);
  d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,33,true);
  d.setUint32(16,crc,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,filename.length,true);d.setUint32(42,offset,true);
  central.push(directory,filename);centralSize+=directory.length+filename.length;offset+=header.length+filename.length+data.length;
 }
 const end=new Uint8Array(22),e=new DataView(end.buffer);
 e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
 return new Blob([...chunks,...central,end],{type:'application/zip'});
}
