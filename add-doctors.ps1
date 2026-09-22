$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhYjE5Mjk4ZTdhNGFjZTFlOWRjNWQ5YSIsImlhdCI6MTc5MDAzMzY5NSwiZXhwIjoxNzkwNjM4NDk1fQ.Xy_olUp8LjiQGkXunm0Zq4fvBefE7Yrbl1p0-ylWc30
"
$base = "https://clinic-appointment-app-production-da2b.up.railway.app/api/doctors"
$headers = @{ Authorization = "Bearer $token" }

$doctors = @(
    @{ name = "Dr. Priya Wickramasinghe"; specialization = "Pediatrics"; bio = "Caring for children from infancy through adolescence for over 12 years."; consultationFee = 2000; availableDays = @("Monday","Tuesday","Thursday") },
    @{ name = "Dr. Kasun Perera"; specialization = "General Physician"; bio = "Your first point of contact for everyday health concerns and checkups."; consultationFee = 1500; availableDays = @("Monday","Tuesday","Wednesday","Thursday","Friday","Saturday") },
    @{ name = "Dr. Amara Fernando"; specialization = "Dermatology"; bio = "Specialist in skin, hair, and nail conditions with a focus on long-term care."; consultationFee = 3500; availableDays = @("Tuesday","Thursday","Saturday") },
    @{ name = "Dr. Nuwan Jayasuriya"; specialization = "Orthopedics"; bio = "Treats bone, joint, and muscle conditions, from sports injuries to arthritis."; consultationFee = 4000; availableDays = @("Monday","Wednesday","Friday") },
    @{ name = "Dr. Ishara De Silva"; specialization = "Neurology"; bio = "Focused on disorders of the brain, spine, and nervous system."; consultationFee = 4500; availableDays = @("Wednesday","Friday") }
)

foreach ($doc in $doctors) {
    $body = $doc | ConvertTo-Json
    Invoke-RestMethod -Uri $base -Method Post -Headers $headers -ContentType "application/json" -Body $body
    Write-Host "Created: $($doc.name)"
}