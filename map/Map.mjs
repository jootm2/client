import { MapTileInfo } from "./MapTileInfo.mjs"

/**
 * 热血传奇2地图
 * 即地图文件(*.map)到JavaScript中数据结构的描述
 */
class M2Map {
	constructor() {
        /** 地图宽度 */
        this.width = 0;
        /** 地图高度 */
        this.height = 0;
        /** 地图块数据 */
        this.tiles = null;
    }
	
	/** 获取地图宽度 */
	getWidth() {
		return this.width;
	}
	/** 设置地图宽度 */
	setWidth(width) {
		this.width = width;
	}
	/** 获取地图高度 */
	getHeight() {
		return this.height;
	}
	/** 设置地图高度 */
	setHeight(height) {
		this.height = height;
	}
	/** 获取地图块信息 */
	getTiles() {
		return this.tiles;
	}
	/** 设置地图块信息 */
	setMapTiles(mapTiles) {
		this.tiles = mapTiles;
	}
}

// 地图在游戏中的数据结构
class GameMap {

    constructor(width, height) {
        // 地图宽度
        this.width = width
        // 地图高度
        this.height = height
        // 地图可站立标记（如不可站立，则不能途径、释放火墙以及灵符等飞行技能）
        this.canStand = []
        // 地图块大地砖所在文件及索引
        this.tilesTextureName = []
        // 地图块小地砖所在文件及索引
        this.smTilesTextureName = []
        // 地图对象层图片所在文件及索引
        this.objsTextureName = []
	
        // 地图对象层图片纹理
        this.objTextureRegions = []
        /// 对象层图片纹理的xy坐标
        this.objTextureRegions2XY = new Map

        // 坐标转换一下
        for (let w = 0; w < this.width; ++w) {
            this.canStand[w] = []
            this.tilesTextureName[w] = []
            this.smTilesTextureName[w] = []
            this.objsTextureName[w] = []

            for (let h = 0; h < this.height; ++h) {
                this.canStand[w][h] = false
                this.tilesTextureName[w][h] = null
                this.smTilesTextureName[w][h] = null
                this.objsTextureName[w][h] = null
            }
        }

        for (let h = 0; h < this.height; ++h) {
            this.objTextureRegions[h] = new Set
        }
    }

    /**
     * 添加特定地图块的对象层纹理
     * @param {number} x 地图横坐标
     * @param {number} y 地图纵坐标
     * @param {PIXI.Texture} tex 对象层纹理
     */
    addObjTextureRegion(x, y, tex) {
		this.objTextureRegions2XY.set(tex, [x, y])
		this.objTextureRegions[y].add(tex)
	}

    /**
     * 获取地图特定行对象纹理
     * @param {number} anchorY 纹理起点纵坐标
     * @returns 地图所有对象纹理
     */
    getObjsTextureRegion(anchorY) {
		return this.objTextureRegions[anchorY]
	}

    /**
     * 获取地图块层纹理所在块坐标
     * @param {PIXI.Texture} tex 层纹理
     * @returns x,y分为在第0，1个元素
     */
    getObjTextureRegion(tex) {
		return this.objTextureRegions2XY.get(tex)
	}
}

export { M2Map, GameMap }