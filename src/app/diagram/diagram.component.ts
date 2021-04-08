import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { from, Observable, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// @ts-ignore
import BpmnModeler from 'bpmn-js/lib/Modeler';
// @ts-ignore
import propertiesPanelModule from 'bpmn-js-properties-panel';
// @ts-ignore
//import propertiesProvider from 'bpmn-js-properties-panel/lib/provider/bpmn';
// @ts-ignore
import propertiesProvider from 'bpmn-js-properties-panel/lib/provider/camunda';

import { CamundaModdleDescriptor } from './CamundaModdleDescriptor';

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.css'],
})
export class DiagramComponent implements OnInit {
  private modeler: any;

  private readonly newDiagram = 'assets/diagram.bpmn';

  public saveHref: any;

  public saveName = '';

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.initBpmn();
  }

  initBpmn() {
    this.modeler = new BpmnModeler({
      container: '#js-canvas',
      propertiesPanel: {
        parent: '#js-properties-panel',
      },
      additionalModules: [propertiesProvider, propertiesPanelModule],

      // needed if you'd like to maintain camunda:XXX properties in the properties panel
      moddleExtensions: {
        camunda: CamundaModdleDescriptor,
      },
    });

    this.loadUrl(this.newDiagram);
  }

  saveDiagram(e: any) {
    this.modeler.saveXML({ format: true }, (err: any, xml: any) => {
      if (err) {
        console.error(err);
      } else {
        this.setEncoded(xml, 'bpmn.xml');
      }
    });
    e.preventDefault();
    e.stopPropagation();
  }

  saveSVG(e: any) {
    this.modeler.saveSVG((err: any, svg: any) => {
      if (err) {
        console.error(err);
      } else {
        this.setEncoded(svg, 'bpmn.svg');
      }
    });
    e.preventDefault();
    e.stopPropagation();
  }

  setEncoded(data: string | number | boolean, name: string) {
    const encodedData = encodeURIComponent(data);

    if (data) {
      this.saveHref = this.sanitizer.bypassSecurityTrustResourceUrl(
        'data:application/bpmn20-xml;charset=UTF-8,' + encodedData
      );
      this.saveName = name;
    }
  }

  loadUrl(url: string): Subscription {
    return this.http
      .get(url, { responseType: 'text' })
      .pipe(
        switchMap((xml: string) => this.importDiagram(xml)),
        map((result) => result.warnings)
      )
      .subscribe(
        (warnings) => {
          // this.importDone.emit({
          //   type: 'success',
          //   warnings
          // });
        }
        // (err) => {
        //   this.importDone.emit({
        //     type: 'error',
        //     error: err
        //   });
        // }
      );
  }

  private importDiagram(xml: string): Observable<{ warnings: Array<any> }> {
    return from(
      this.modeler.importXML(xml) as Promise<{ warnings: Array<any> }>
    );
  }
}
