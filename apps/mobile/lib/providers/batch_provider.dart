import 'package:flutter/material.dart';
import 'package:alledu_mobile/core/api/api_client.dart';
import 'package:alledu_mobile/models/batch.dart';

class BatchProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<BatchSummary> _exploreBatches = [];
  List<BatchSummary> _enrolledBatches = [];
  BatchDetail? _activeBatch;
  List<LiveClass> _liveClasses = [];
  List<StudyMaterialItem> _studyMaterials = [];

  bool _isLoading = false;
  String? _errorMessage;

  List<BatchSummary> get exploreBatches => _exploreBatches;
  List<BatchSummary> get enrolledBatches => _enrolledBatches;
  BatchDetail? get activeBatch => _activeBatch;
  List<LiveClass> get liveClasses => _liveClasses;
  List<StudyMaterialItem> get studyMaterials => _studyMaterials;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Explore Batches
  Future<void> fetchExploreBatches() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.get('/batches');
      dynamic raw = response.data;
      if (raw is Map) {
        raw = raw['data'] ?? raw['items'] ?? raw['batches'];
      }
      if (raw is List) {
        _exploreBatches = raw.map((b) => BatchSummary.fromJson(b)).toList();
      }
    } catch (e) {
      _errorMessage = 'Failed to fetch explore batches';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Enrolled Batches
  Future<void> fetchEnrolledBatches() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.get('/batches/enrolled');
      dynamic raw = response.data;
      if (raw is Map) {
        raw = raw['data'] ?? raw['items'] ?? raw['batches'];
      }
      if (raw is List) {
        _enrolledBatches = raw.map((b) => BatchSummary.fromJson(b)).toList();
      }
    } catch (e) {
      _errorMessage = 'Failed to fetch enrolled batches';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Batch details, live classes & materials
  Future<void> fetchBatchDetail(String slugOrId) async {
    _isLoading = true;
    _errorMessage = null;
    _activeBatch = null;
    _liveClasses = [];
    _studyMaterials = [];
    notifyListeners();

    try {
      final res = await _apiClient.get('/batches/$slugOrId');
      final batchData = res.data['data'] ?? res.data;
      _activeBatch = BatchDetail.fromJson(batchData);
      
      if (_activeBatch!.isEnrolled) {
        await Future.wait([
          _fetchLiveClasses(_activeBatch!.id),
          _fetchStudyMaterials(_activeBatch!.id),
        ]);
      }
    } catch (e) {
      _errorMessage = 'Failed to load batch details';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _fetchLiveClasses(String batchId) async {
    try {
      final res = await _apiClient.get('/live-classes?batchId=$batchId');
      final data = res.data as List?;
      if (data != null) {
        _liveClasses = data.map((l) => LiveClass.fromJson(l)).toList();
      }
    } catch (_) {}
  }

  Future<void> _fetchStudyMaterials(String batchId) async {
    try {
      final res = await _apiClient.get('/study-materials?batchId=$batchId');
      final data = res.data as List?;
      if (data != null) {
        _studyMaterials = data.map((s) => StudyMaterialItem.fromJson(s)).toList();
      }
    } catch (_) {}
  }

  // Delete Batch
  Future<bool> deleteBatch(String batchId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      await _apiClient.delete('/batches/$batchId');
      await fetchExploreBatches();
      await fetchEnrolledBatches();
      return true;
    } catch (e) {
      if (e.toString().contains('students are already enrolled')) {
        _errorMessage = 'Cannot delete batch: Students are enrolled.';
      } else {
        _errorMessage = 'Failed to delete batch.';
      }
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Enroll Free
  Future<bool> enrollInFreeBatch(String batchId) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _apiClient.post('/batches/$batchId/enroll');
      if (_activeBatch != null && _activeBatch!.id == batchId) {
        await fetchBatchDetail(_activeBatch!.identifier);
      }
      await fetchEnrolledBatches();
      return true;
    } catch (_) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Mock Purchase Payment Order (Simulator helper)
  Future<bool> simulatePurchase(String batchId) async {
    _isLoading = true;
    notifyListeners();
    try {
      // 1. Create order
      final orderRes = await _apiClient.post('/payments/order', data: {'batch_id': batchId});
      final orderId = orderRes.data['orderId'];
      
      if (orderId != null) {
        // 2. Simply trigger enrollment success on backend
        await _apiClient.post('/batches/$batchId/enroll'); 
        if (_activeBatch != null && _activeBatch!.id == batchId) {
          await fetchBatchDetail(_activeBatch!.identifier);
        }
        await fetchEnrolledBatches();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
