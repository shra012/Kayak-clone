output "msk_cluster_arn" {
  description = "MSK cluster ARN"
  value       = aws_msk_cluster.this.arn
}

output "msk_cluster_name" {
  description = "MSK cluster name"
  value       = aws_msk_cluster.this.cluster_name
}

output "msk_bootstrap_brokers_sasl_iam" {
  description = "Bootstrap brokers string for IAM-authenticated clients"
  value       = aws_msk_cluster.this.bootstrap_brokers_sasl_iam
  sensitive   = true
}

output "msk_zookeeper_connect_string" {
  description = "Zookeeper connect string"
  value       = aws_msk_cluster.this.zookeeper_connect_string
  sensitive   = true
}

output "msk_log_group_name" {
  description = "CloudWatch log group used for broker logs"
  value       = aws_cloudwatch_log_group.msk.name
}

output "bastion_instance_id" {
  description = "Instance ID of the bastion host for MSK tunnel"
  value       = aws_instance.bastion.id
}

output "bastion_security_group_id" {
  description = "Security group ID of the bastion host"
  value       = aws_security_group.bastion.id
}
