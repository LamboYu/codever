import {Injectable} from '@angular/core';

import {shareReplay} from 'rxjs/operators';

import {Observable} from 'rxjs';

import {environment} from 'environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Injectable()
export class AdminService {

  private adminApiBaseUrl = '';
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    this.adminApiBaseUrl = environment.API_URL + '/admin';
  }

}
