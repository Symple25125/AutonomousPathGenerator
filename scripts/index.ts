import { 
    cmPerPixel,
    updateCanvasSize,
    addOnClickEvent,
    addOnContextmenuEvent,
    getCanvasPos,
    getCanvasSize,
    drawImage,
    drawCircle,
    drawLine,
    drawSquare
} from "./Canvas.js"

import Point from "./Point.js"
import Vec2d from "./Vec2d.js"
import { getRobotHeight, getRobotWidth, updatePointSettings, updateRobotSettings } from "./Settings.js"

import Line from "./shapes/Line.js"
import Circle from "./shapes/Circle.js"

const centerStageImage = new Image(30, 30)
centerStageImage.src = "/centerstage.webp"

const pointRadius = 5

const points: Point[] = []
export let selectedPoint: Point | null = null;

updateCanvasSize()
updateRobotSettings()

const selectPoint = (point: Point) => {
    selectedPoint = point
    updatePointSettings(selectedPoint)
}

export const makePointStart = (point: Point) => {
    points.forEach(p => {
        p.start = false;
        if(p.connection == point.id) p.connection = null
    });
    point.start = true
    updatePointSettings(point)
}

const removePoint = (point: Point) => {
    const index = points.findIndex(pt => pt.id == point.id);
    if(index >= 0) points.splice(index, 1);
}

addOnClickEvent((event: MouseEvent) => {
    const canavsPos = getCanvasPos()

    const xPos = event.x - canavsPos.x
    const yPos = event.y - canavsPos.y

    for(const p of points) {
        if(p.calcDist(new Vec2d(xPos, yPos)) <= (pointRadius * 2)) {
            if(event.shiftKey) {
                if(selectedPoint && !p.start) {
                    if(selectedPoint.connection != p.id) selectedPoint.connection = p.id;
                    else selectedPoint.connection = null;
                    return updatePointSettings(selectedPoint);
                }
            } else if(event.ctrlKey) {
                return makePointStart(p);
            }
            return selectPoint(p);
        }
    }
    
    const point = new Point(xPos * cmPerPixel, yPos * cmPerPixel, genUUID());
    if(event.shiftKey) {
        if(selectedPoint) {
            selectedPoint.connection = point.id;
        }
    }
    selectPoint(point);

    points.push(point)
})

addOnContextmenuEvent((event: MouseEvent) => {
    const canavsPos = getCanvasPos()

    const xPos = event.x - canavsPos.x
    const yPos = event.y - canavsPos.y

    event.preventDefault()

    for(const p of points) {
        if(p.calcDist(new Vec2d(xPos, yPos)) <= pointRadius) 
            return removePoint(p);
    }
})

function draw() {
    const { width: screenWidth, height: screenHeight } = getCanvasSize()

    drawImage(centerStageImage, 0, 0, screenWidth, screenHeight)
    
    const lineRenderQueue: Line[] = []
    const pointRenderQueue: Circle[] = []

    for(const p of points) {
        const pos = p.getPosAsPixel()
        let pointNormalColor = p.start ? "#990055" : "#ff00ee";
        let pointSelectedColor = p.start ? "#ff0033" : "#3300ff";

        const color = selectedPoint.id == p.id ? pointSelectedColor : pointNormalColor
        pointRenderQueue.push(new Circle(pos.x, pos.y, pointRadius, color))

        const connectionPoint = points.find(pt => pt.id == p.connection)
        
        if(selectedPoint.id == p.id) {
            const relSize = new Vec2d(getRobotWidth(), getRobotHeight()).div(cmPerPixel)
            const robotCenterPos = pos.sub(relSize.div(2))
            
            let angle: number = 0;

            if(connectionPoint != null) {
                const idk = connectionPoint.pos.sub(p.pos)
                angle = Math.atan2(idk.y, idk.x) * 180 / Math.PI;
            }

            drawSquare(robotCenterPos.x, robotCenterPos.y, relSize.x, relSize.y, angle, "#ff8800", 2)
        }

        if(connectionPoint != null) {
            const cpPos = connectionPoint.getPosAsPixel()
            let lineNormalColor = connectionPoint.connection == p.id ? "#009900" : "#0099ff";
            let lineSelectedColor = connectionPoint.connection == p.id ? "#00ff00" : "#00ffff";

            let lineColor = selectedPoint.id == p.id || (connectionPoint.connection == p.id && selectedPoint.id == connectionPoint.id) ? lineSelectedColor : lineNormalColor;

            lineRenderQueue.push(new Line(pos, cpPos, lineColor, 4))
        }
    } 

    for(const line of lineRenderQueue) {
        drawLine(line.from, line.to, line.color, line.width)
    }

    for(const point of pointRenderQueue) {
        drawCircle(point.x, point.y, point.radius, point.color, 1, point.color)
    }

    requestAnimationFrame(draw)
}

requestAnimationFrame(draw)




function genUUID() {
    let s = "abcdefghijklmnopqrstuvwxyz1234567890"
    
    let emptyString = ""
    for(let i = 0; i < 4; i++) {
        emptyString += s[Math.floor(Math.random() * s.length)];
    }

    if(points.some(p => p.id == emptyString)) return genUUID()
    return emptyString;
}