import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:path_provider/path_provider.dart';


class Api {

  static Api? _instance;
  final Dio _dio;

  // Static constant for the Base URL
  // Run with: flutter run --dart-define=API_BASE_URL=https://api.yourdomain.com
  static const String _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000/api',
    // defaultValue: 'https://inkboard.xyz/api',
  );

  Api._(this._dio);

  static Api get instance {
    if (_instance == null) {
      throw Exception('Api instance not initialized. Call Api() constructor first.');
    }
    return _instance!;
  }

  static Future<void> initialize() async {
    final dio = Dio(
      BaseOptions(
        baseUrl: _baseUrl,
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 3),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        extra: {'withCredentials': true},
        validateStatus: (status) => status != null && status >= 200 && status < 300,
      ),
    );

    // Initialize cookie management
    final appDocDir = await getApplicationDocumentsDirectory();
    final cookieJar = PersistCookieJar(storage: FileStorage(appDocDir.path));

    dio.interceptors.add(CookieManager(cookieJar));

    _instance = Api._(dio);
    _instance!._initializeInterceptors();
  }

  void _initializeInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {

          print('--> ${options.method} ${options.path}');
          return handler.next(options);
        },
        onResponse: (response, handler) {

          print('<-- ${response.statusCode} ${response.requestOptions.path}');
          return handler.next(response);
        },
        onError: (DioException e, handler) {
          print('ERROR[${e.response?.statusCode}] => PATH: ${e.requestOptions.path}');
          
          // Global error handling (e.g., 401 Unauthorized)
          if (e.response?.statusCode == 401) {
            // Logic to trigger a logout or token refresh
          }
          
          return handler.next(e);
        },
      ),
    );
  }

  // --- HTTP Methods ---

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }
}