import { M2Map, GameMap } from "./Map.mjs"
import { MapTileInfo } from "./MapTileInfo.mjs"

const mapUrls = new Map
const loadedMaps = new Map
const loadingMaps = new Set
// 已经加载完成的地图
const cachedGameMaps = new Map
// 地图异步加载工具
class Maps {

    static setMapUrl(mapNo, url) {
        mapUrls.set(mapNo, url)
    }

    static get(mapNo) {
        if (!mapUrls.has(mapNo)) {
            console.warn(`${mapNo} does not exists, please call setMapUrl to set file address first`)
            return null;
        }
        if (cachedGameMaps.has(mapNo)) return cachedGameMaps.get(mapNo)
        if (loadingMaps.has(mapNo)) return null;
        loadingMaps.add(mapNo)
        fetch(mapUrls.get(mapNo)).then(resp => {
            if (!resp.ok) {
                throw new Error('Network response was not ok');
            }
            return resp.arrayBuffer();
        }).then(mapData => {
            loadingMaps.delete(mapNo)
            const buffer = new DataView(mapData)
            let offset = 0
            var map = new M2Map
            map.setWidth(buffer.getUint16(offset, true))
            offset += 2
            map.setHeight(buffer.getUint16(offset, true))
            offset += 2
            offset += 48
            const tileByteSize = (mapData.byteLength - offset) / map.getWidth() / map.getHeight()
            const mapTileInfos = []
            for (let width = 0; width < map.getWidth(); ++width) {
                mapTileInfos[width] = []
                for (let height = 0; height < map.getHeight(); ++height) {
                    const mi = new MapTileInfo
                    // 读取背景
					const bng = buffer.getInt16(offset, true)
                    offset += 2
					// 读取中间层
					const mid = buffer.getInt16(offset, true)
                    offset += 2
					// 读取对象层
					const obj = buffer.getInt16(offset, true)
                    offset += 2
					// 设置背景
					if ((bng & 0x7fff) > 0) {
						mi.setBngImgIdx((bng & 0x7fff) - 1);
						mi.setHasBng(true);
					}
					// 设置中间层
					if ((mid & 0x7fff) > 0) {
						mi.setMidImgIdx((mid & 0x7fff) - 1);
						mi.setHasMid(true);
					}
					// 设置对象层
					if ((obj & 0x7fff) > 0) {
						mi.setObjImgIdx((obj & 0x7fff) - 1);
						mi.setHasObj(true);
					}

					mi.setCanStand(true);
					if ((bng & 0x8000) != 0) {
						mi.setCanStand(false);
					}
					if ((mid & 0x8000) != 0) {
						mi.setCanStand(false);
					}
					if ((obj & 0x8000) != 0) {
						mi.setCanStand(false);
					}

					// 读取门索引(第7个byte)
					let btTmp = buffer.getInt8(offset)
                    offset++
					if ((btTmp & 0x80) == 0x80) {
						mi.setDoorCanOpen(true);
					}
					mi.setDoorIdx(btTmp & 0x7F);
					// 读取门偏移(第8个byte)
					btTmp = buffer.getInt8(offset)
                    offset++
					if (btTmp != 0) {
						mi.setHasDoor(true);
					}
					mi.setDoorOffset(btTmp & 0xFF);
					// 读取动画帧数(第9个byte)
					btTmp = buffer.getInt8(offset)
                    offset++
					if ((btTmp & 0x7F) > 0) {
						mi.setAniFrame(btTmp & 0x7F);
						mi.setHasAni(true);
						mi.setHasObj(false);
						mi.setAniBlendMode((btTmp & 0x80) == 0x80);
					}
					// 读取并设置动画跳帧数(第10个byte)
					mi.setAniTick(buffer.getInt8(offset));
                    offset++
					// 读取资源文件索引(第11个byte)
					mi.setObjFileIdx(buffer.getInt8(offset));
                    offset++
					if (mi.getObjFileIdx() != 0)
						mi.setObjFileIdx(mi.getObjFileIdx() + 1);
					// 读取光照(第12个byte)
					mi.setLight(buffer.getInt8(offset));
                    offset++
					if (tileByteSize == 14) {
						mi.setBngFileIdx(buffer.getInt8(offset));
                        offset++
						if (mi.getBngFileIdx() != 0)
							mi.setBngFileIdx(mi.getBngFileIdx() + 1);
						mi.setMidFileIdx(buffer.getInt8(offset));
                        offset++
						if (mi.getMidFileIdx() != 0)
							mi.setMidFileIdx(mi.getMidFileIdx() + 1);
					} else if (tileByteSize > 14) {
                        offset += tileByteSize - 14
						console.error(`${mapUrls.get(mapNo)} have unkwon tileByteSize ${tileByteSize}`);
					}
					if (width % 2 != 0 || height % 2 != 0)
						mi.setHasBng(false);
					//console.log(`${width}-${height}`)
					//console.log(mi.toString())
					mapTileInfos[width][height] = mi;
				}
            }
            map.setMapTiles(mapTileInfos);
            loadedMaps.set(mapNo, map)
			// 静态地图转游戏中的动态地图
			const gameMap = new GameMap(map.getWidth(), map.getHeight())
			{
				for (let w = 0; w < map.getWidth(); ++w) {
					for (let h = 0; h < map.getHeight(); ++h) {
						const mi = map.getTiles()[w][h]
						gameMap.canStand[w][h] = mi.isCanStand()
						if (mi.isHasBng()) {
							let tileTextureName = "tiles"
							if (mi.getBngFileIdx() != 0) {
								tileTextureName += mi.getBngFileIdx()
							}
							tileTextureName += "/" + mi.getBngImgIdx()
							gameMap.tilesTextureName[w][h] = tileTextureName
						}
						if (mi.isHasMid()) {
							let smTileTextureName = "smtiles"
							if (mi.getMidFileIdx() != 0) {
								smTileTextureName += mi.getMidFileIdx()
							}
							smTileTextureName += "/" + mi.getMidImgIdx()
							gameMap.smTilesTextureName[w][h] = smTileTextureName
						}
						if (!mi.isHasAni() && mi.isHasObj()) {
							let objTextureName = "objects"
							if (mi.getObjFileIdx() != 0) {
								objTextureName += mi.getObjFileIdx()
							}
							objTextureName += "/" + mi.getObjImgIdx()
							gameMap.objsTextureName[w][h] = objTextureName
						}
					}
				}
			}
			cachedGameMaps.set(mapNo, gameMap)
        }).catch(err => {
            loadingMaps.delete(mapNo)
            console.error(err);
        });
        return null
    }
}

export { Maps }