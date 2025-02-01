import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import Konva from 'konva';
// import { Point} from 'konva';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  @ViewChild('stageContainer') stageContainer!: ElementRef;

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private backgroundLayer!: Konva.Layer;
  private currentPolygon: any[] = [];
  private polygons: Konva.Line[] = [];
  private imageObj = new Image();

  ngAfterViewInit() {
    this.initializeStage();
    this.setupEventListeners();
  }

  private initializeStage() {
    const container = this.stageContainer.nativeElement;
    
    this.stage = new Konva.Stage({
      container: 'stage-container',
      width: container.offsetWidth,
      height: container.offsetHeight,
    });

    this.backgroundLayer = new Konva.Layer();
    this.layer = new Konva.Layer();
    
    this.stage.add(this.backgroundLayer);
    this.stage.add(this.layer);
  }

  private setupEventListeners() {
    this.stage.on('click', (e) => {
      const pos = this.stage.getPointerPosition();
      if (!pos) return;

      this.currentPolygon.push({ x: pos.x, y: pos.y });
      this.drawCurrentPolygon();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'n') {
        this.closePolygon();
      }
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = () => {
        this.imageObj.src = reader.result as string;
        this.imageObj.onload = () => {
          const backgroundImage = new Konva.Image({
            image: this.imageObj,
            width: this.stage.width(),
            height: this.stage.height(),
          });
          
          this.backgroundLayer.removeChildren();
          this.backgroundLayer.add(backgroundImage);
          this.backgroundLayer.batchDraw();
        };
      };

      reader.readAsDataURL(file);
    }
  }

  private drawCurrentPolygon() {
    this.layer.destroyChildren();
    
    this.polygons.forEach(polygon => {
      this.layer.add(polygon);
    });

    if (this.currentPolygon.length > 0) {
      const line = new Konva.Line({
        points: this.currentPolygon.reduce<number[]>((acc, point) => {
          acc.push(point.x, point.y);
          return acc;
        }, []),
        stroke: 'red',
        strokeWidth: 2,
        closed: false
      });
      
      this.layer.add(line);
    }

    this.layer.batchDraw();
  }

  private closePolygon() {
    if (this.currentPolygon.length >= 3) {
      const polygon = new Konva.Line({
        points: this.currentPolygon.reduce<number[]>((acc, point) => {
          acc.push(point.x, point.y);
          return acc;
        }, []),
        stroke: 'red',
        strokeWidth: 2,
        fill: 'rgba(255, 0, 0, 0.2)',
        closed: true
      });

      this.polygons.push(polygon);
      this.currentPolygon = [];
      this.drawCurrentPolygon();
    }
  }

  clearPolygons() {
    this.polygons = [];
    this.currentPolygon = [];
    this.layer.destroyChildren();
    this.layer.batchDraw();
  }

  exportMask() {
    const maskData = this.polygons.map(polygon => {
      const points = polygon.points();
      const vertices = [];
      for (let i = 0; i < points.length; i += 2) {
        vertices.push({
          x: points[i],
          y: points[i + 1]
        });
      }
      return vertices;
    });

    const json = JSON.stringify(maskData, null, 2);
    console.log(json);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mask.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
