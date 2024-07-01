# Vagrantfile

Vagrant.configure("2") do |config|
    config.vm.define "staging" do |staging|
      staging.vm.box = "ubuntu/bionic64" 
      staging.vm.hostname = "staging"
      staging.vm.network "private_network", ip: "192.168.56.101" 
  
      staging.vm.provider "virtualbox" do |vb|
        vb.memory = "1024"
        vb.cpus = 1
      end
  
      staging.ssh.insert_key = false
      staging.vm.provision "shell", inline: <<-SHELL
        echo "staging: Setting up SSH access"
        apt-get update
        apt-get install -y openssh-server
        mkdir -p /home/vagrant/.ssh
        cp /vagrant/jenkins_key.pub /home/vagrant/.ssh/authorized_keys
        chmod 600 /home/vagrant/.ssh/authorized_keys
        chown -R vagrant:vagrant /home/vagrant/.ssh
      SHELL

      staging.vm.network "forwarded_port", guest: 3003, host: 3003
    end
  
    config.vm.define "load-test" do |load_test|
      load_test.vm.box = "ubuntu/bionic64" 
      load_test.vm.hostname = "load-test"
      load_test.vm.network "private_network", ip: "192.168.56.102" 
  
      load_test.vm.provider "virtualbox" do |vb|
        vb.memory = "1024"
        vb.cpus = 1
      end
  
      load_test.ssh.insert_key = false
      load_test.vm.provision "shell", inline: <<-SHELL
        echo "load-test: Setting up SSH access"
        apt-get update
        apt-get install -y openssh-server
        mkdir -p /home/vagrant/.ssh
        cp /vagrant/jenkins_key.pub /home/vagrant/.ssh/authorized_keys
        chmod 600 /home/vagrant/.ssh/authorized_keys
        chown -R vagrant:vagrant /home/vagrant/.ssh
      SHELL
      load_test.vm.network "forwarded_port", guest: 3004, host: 3004
      load_test.vm.network "forwarded_port", guest: 3006, host: 3006
    end
  
    # Forward ports for SSH access from the local machine
    config.vm.network "forwarded_port", guest: 22, host: 2222, id: "ssh_staging", auto_correct: true
    config.vm.network "forwarded_port", guest: 22, host: 2223, id: "ssh_load_test", auto_correct: true
  end
  