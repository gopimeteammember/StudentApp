// src/app/student.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define an interface for type safety (optional but recommended)
interface Student {
  firstName: string;
  lastName: string;
  email: string;
  course: string;
}

@Injectable({
  // 'root' means the service is available throughout the application
  providedIn: 'any'
})

export class StudentService {
  private apiUrl: string;
  private readonly apiPath = '/api/student';

  // Inject the HttpClient service
  constructor(private http: HttpClient) {
    // Check if the code is running in a browser environment (where 'window' is defined).
    const isBrowser = typeof window !== 'undefined';

    if (isBrowser) {
      // 1. If in the browser, determine the base URL based on the current hostname.
      const isVercel = window.location.hostname.includes('vercel.app');

      if (isVercel) {
        // Use the live Vercel domain for production/Vercel previews
        this.apiUrl = 'https://student-app-dun.vercel.app' + this.apiPath;
      } else {
        // Use localhost for local development (e.g., when running ng serve)
        this.apiUrl = 'http://localhost:3000' + this.apiPath;
      }
    } else {
      // 2. If running on the server (SSR), default to the production/Vercel URL.
      // The server rendering process is usually part of the deployment pipeline.
      this.apiUrl = 'https://student-app-dun.vercel.app' + this.apiPath;
    }

    // console.log('StudentService API URL set to:', this.apiUrl); // Optional debug line
  }

  /**
   * Sends a POST request to the backend API to register a new student.
   * @param student - The student data object to be registered.
   * @returns An Observable of the HTTP response from the backend.
   */
  registerStudent(student: Student): Observable<any> {
    // The http.post() method sends a POST request to the apiUrl 
    // with the 'student' object as the request body.
    return this.http.post<any>(this.apiUrl, student);
  }
}


// export class StudentService {
//   // IMPORTANT: Replace this with the URL of your actual backend API endpoint.
//   // This is the endpoint that will receive the POST request and save to PostgreSQL.
//   // private apiUrl = 'http://localhost:3000/api/student'; 
//   private apiUrl = 'https://student-app-dun.vercel.app/api/student'; 

//   // private apiUrl = 'https://dpg-d3403le3jp1c73ffjf20-a/dataentryapp/api/student';

//   // Inject the HttpClient service
//   constructor(private http: HttpClient) { }

//   /**
//    * Sends a POST request to the backend API to register a new student.
//    * @param student - The student data object to be registered.
//    * @returns An Observable of the HTTP response from the backend.
//    */
//   registerStudent(student: Student): Observable<any> {
//     // The http.post() method sends a POST request to the apiUrl 
//     // with the 'student' object as the request body.
//     return this.http.post<any>(this.apiUrl, student);
//   }
// }