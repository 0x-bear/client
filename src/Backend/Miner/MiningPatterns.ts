import { Rectangle } from '../../_types/global/GlobalTypes';
import { WorldCoords } from '@darkforest_eth/types';
import { ConsoleLogger } from 'typedoc/dist/lib/utils';


export enum MiningPatternType {
  Home,
  Target,
  Spiral,
  Cone,
  Grid,
  ETH,
  SwissCheese,
  Circle
}

export interface MiningPattern {
  type: MiningPatternType;
  fromChunk: Rectangle;
  nextChunk: (prevLoc: Rectangle) => Rectangle;
}

export class CirclePattern implements MiningPattern {
  type: MiningPatternType = MiningPatternType.Circle;
  fromChunk: Rectangle;
  chunkSideLength: number;
  rotatedRadians: number;
  scaleUpRadius: number;
  nextBottomLeft: WorldCoords;
  internalX: number;
  internalY: number;

  constructor(center: WorldCoords, chunkSize: number) {
    const bottomLeftX = Math.floor(center.x / chunkSize) * chunkSize;
    const bottomLeftY = Math.floor(center.y / chunkSize) * chunkSize;
    var bottomLeft = { x: bottomLeftX, y: bottomLeftY };
    this.internalX = bottomLeftX;
    this.internalY = bottomLeftY;
    this.nextBottomLeft = { x: -1, y: -1 };
    this.fromChunk = {
      bottomLeft,
      sideLength: chunkSize,
    };
    this.chunkSideLength = chunkSize;
    this.rotatedRadians = 0;
  }

  sleep(ms: number | undefined) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  sleepHard(sleepDuration: number){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ 
        /* Do nothing */  
    }
  }

  rotate(cx: number, cy: number, x: number, y: number, angle: number) {
    var radians = (Math.PI / 180) * angle;
    let cos = Math.cos(radians);
    let sin = Math.sin(radians);
    let nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
    let ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return [nx, ny];
  }

  rotateRadians(cx: number, cy: number, x: number, y: number, radians: number) {
    let cos = Math.cos(radians);
    let sin = Math.sin(radians);
    let nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
    let ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return [nx, ny];
  }

  nextChunk(chunk: Rectangle): Rectangle {
    const homeX = this.fromChunk.bottomLeft.x;
    const homeY = this.fromChunk.bottomLeft.y;
    var currX = this.internalX;
    var currY = this.internalY;

    //var nextBottomLeft = { x: currX, y: currY };

    let vectorFromHome = { x: currX - homeX, y: currY - homeY };
    console.log('vectorFromHome: ('+vectorFromHome.x+','+vectorFromHome.y+')');
    let radius = Math.sqrt((vectorFromHome.x)**2 + (vectorFromHome.y)**2);
    console.log('radius: '+radius);
    //let chunkRadius = Math.sqrt(this.chunkSideLength**2 + this.chunkSideLength**2);
    let chunkRadius = Math.sqrt((this.chunkSideLength)**2 + (this.chunkSideLength)**2);
    console.log('chunkRadius: '+chunkRadius);
    //vectorFromHome.x = vectorFromHome.x * 1 / radius;
    //vectorFromHome.y = vectorFromHome.y * 1 / radius;

    // flip it 90 degrees
    let directionVector = this.rotate(0,0,
      vectorFromHome.x,vectorFromHome.y,90);
    //console.log('directionVector: ('+directionVector[0]+','+directionVector[1]+')');

    if (currX === homeX && currY === homeY) {
      this.nextBottomLeft.y = homeY + this.chunkSideLength;
      this.nextBottomLeft.x = homeX;
      this.internalX = this.nextBottomLeft.x;
      this.internalY = this.nextBottomLeft.y;
    } else {
      //nextBottomLeft.x += Math.round(directionVector[0]*chunkRadius/radius);
      //nextBottomLeft.y += Math.round(directionVector[1]*chunkRadius/radius);
      let angle = 2*Math.asin(chunkRadius/2/radius);
      this.rotatedRadians += angle;
      if (this.rotatedRadians >= Math.PI*2) {
        //currX = currX + chunkRadius*Math.sqrt(2);
        //currY = currY + chunkRadius*Math.sqrt(2);
        currX = currX + vectorFromHome.x/radius*this.chunkSideLength/Math.sqrt(2);
        currY = currY + vectorFromHome.y/radius*this.chunkSideLength/Math.sqrt(2);
        vectorFromHome = { x: currX - homeX, y: currY - homeY };
        let oldRadius = radius;
        radius = Math.sqrt((vectorFromHome.x)**2 + (vectorFromHome.y)**2);
        console.log('increased radius from '+oldRadius+' to '+radius);
        angle = 2*Math.asin(chunkRadius/2/radius);
        this.rotatedRadians = 0;
      }
      
      console.log('home='+homeX+','+homeY+' curr='+currX+','+currY);
      console.log('angle= '+angle);
      const [tempX, tempY] = this.rotateRadians(homeX,homeY,currX,currY,angle);
      // this.internalX = tempX;
      // this.internalY = tempY;
      const newX = Math.round(tempX/this.chunkSideLength)*this.chunkSideLength;
      const newY = Math.round(tempY/this.chunkSideLength)*this.chunkSideLength;
      this.internalX = newX;
      this.internalY = newY;

      this.nextBottomLeft.x = newX;
      this.nextBottomLeft.y = newY;
    }
    //df.getExploredChunks

    // if crossing due North, push up
    // if ((vectorFromHome.x <0) &&  (nextBottomLeft.x - homeX >= 0)) {
    //   nextBottomLeft.y += this.chunkSideLength;
    // }
    console.log('from ('+currX+','+currY+') to ('+this.nextBottomLeft.x+','+this.nextBottomLeft.y+')')
    //this.sleepHard(10 * 1000);

    return {
      bottomLeft: this.nextBottomLeft,
      sideLength: this.chunkSideLength,
    };
  }
}

export class SpiralPattern implements MiningPattern {
  type: MiningPatternType = MiningPatternType.Spiral;
  fromChunk: Rectangle;
  chunkSideLength: number;

  constructor(center: WorldCoords, chunkSize: number) {
    const bottomLeftX = Math.floor(center.x / chunkSize) * chunkSize;
    const bottomLeftY = Math.floor(center.y / chunkSize) * chunkSize;
    const bottomLeft = { x: bottomLeftX, y: bottomLeftY };
    this.fromChunk = {
      bottomLeft,
      sideLength: chunkSize,
    };
    this.chunkSideLength = chunkSize;
  }

  nextChunk(chunk: Rectangle): Rectangle {
    const homeX = this.fromChunk.bottomLeft.x;
    const homeY = this.fromChunk.bottomLeft.y;
    const currX = chunk.bottomLeft.x;
    const currY = chunk.bottomLeft.y;

    const nextBottomLeft = { x: currX, y: currY };

    if (currX === homeX && currY === homeY) {
      nextBottomLeft.y = homeY + this.chunkSideLength;
    } else if (currY - currX > homeY - homeX && currY + currX >= homeX + homeY) {
      if (currY + currX === homeX + homeY) {
        // break the circle
        nextBottomLeft.y = currY + this.chunkSideLength;
      } else {
        nextBottomLeft.x = currX + this.chunkSideLength;
      }
    } else if (currX + currY > homeX + homeY && currY - currX <= homeY - homeX) {
      nextBottomLeft.y = currY - this.chunkSideLength;
    } else if (currX + currY <= homeX + homeY && currY - currX < homeY - homeX) {
      nextBottomLeft.x = currX - this.chunkSideLength;
    } else {
      // if (currX + currY < homeX + homeY && currY - currX >= homeY - homeX)
      nextBottomLeft.y = currY + this.chunkSideLength;
    }

    return {
      bottomLeft: nextBottomLeft,
      sideLength: this.chunkSideLength,
    };
  }
}

export class SwissCheesePattern implements MiningPattern {
  type: MiningPatternType = MiningPatternType.SwissCheese;
  fromChunk: Rectangle;
  chunkSideLength: number;

  constructor(center: WorldCoords, chunkSize: number) {
    const bottomLeftX = Math.floor(center.x / chunkSize) * chunkSize;
    const bottomLeftY = Math.floor(center.y / chunkSize) * chunkSize;
    const bottomLeft = { x: bottomLeftX, y: bottomLeftY };
    this.fromChunk = {
      bottomLeft,
      sideLength: chunkSize,
    };
    this.chunkSideLength = chunkSize;
  }

  nextChunk(chunk: Rectangle): Rectangle {
    const homeX = this.fromChunk.bottomLeft.x;
    const homeY = this.fromChunk.bottomLeft.y;
    const currX = chunk.bottomLeft.x;
    const currY = chunk.bottomLeft.y;

    const nextBottomLeft = { x: currX, y: currY };

    if (currX === homeX && currY === homeY) {
      nextBottomLeft.y = homeY + this.chunkSideLength * 2;
    } else if (currY - currX > homeY - homeX && currY + currX >= homeX + homeY) {
      if (currY + currX === homeX + homeY) {
        // break the circle
        nextBottomLeft.y = currY + this.chunkSideLength * 2;
      } else {
        nextBottomLeft.x = currX + this.chunkSideLength * 2;
      }
    } else if (currX + currY > homeX + homeY && currY - currX <= homeY - homeX) {
      nextBottomLeft.y = currY - this.chunkSideLength * 2;
    } else if (currX + currY <= homeX + homeY && currY - currX < homeY - homeX) {
      nextBottomLeft.x = currX - this.chunkSideLength * 2;
    } else {
      // if (currX + currY < homeX + homeY && currY - currX >= homeY - homeX)
      nextBottomLeft.y = currY + this.chunkSideLength * 2;
    }

    return {
      bottomLeft: nextBottomLeft,
      sideLength: this.chunkSideLength,
    };
  }
}
